import pandas as pd
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
import numpy as np

def find_substitutes(target_product_id, all_products):
    """
    Finds similar products based on their features using a more robust pipeline.
    """
    if not all_products:
        return []

    df = pd.DataFrame(all_products)

    # --- Preprocessing ---
    # Ensure all products have an inventory dictionary
    df['inventory'] = df['inventory'].apply(lambda x: x if isinstance(x, dict) else {'stock': 0, 'salesVelocity': 0})
    
    # Create a string from the list of features for vectorization
    df['features_str'] = df['features'].apply(lambda x: ' '.join(x) if isinstance(x, list) else '')

    # --- Feature Engineering ---
    # Define which columns to use for different transformations
    numerical_features = ['baseCost', 'price']
    categorical_features = ['category']
    text_features = 'features_str'
    
    # Create preprocessing pipelines for each data type
    numerical_transformer = StandardScaler()
    categorical_transformer = OneHotEncoder(handle_unknown='ignore')
    text_transformer = TfidfVectorizer(stop_words='english')

    # Create a preprocessor object using ColumnTransformer
    # This applies the right transformation to the right column
    preprocessor = ColumnTransformer(
        transformers=[
            ('num', numerical_transformer, numerical_features),
            ('cat', categorical_transformer, categorical_features),
            ('text', text_transformer, text_features)
        ],
        remainder='drop' # Drop other columns
    )

    # --- Cosine Similarity Calculation ---
    # Fit and transform the data
    try:
        feature_matrix = preprocessor.fit_transform(df)
    except Exception as e:
        print(f"✗ Error during feature matrix creation: {e}")
        return [] # Return empty if processing fails

    cosine_sim_matrix = cosine_similarity(feature_matrix)
    
    # Create a mapping from product ID to its index
    id_to_idx = pd.Series(range(len(df)), index=df.id)
    
    try:
        target_idx = id_to_idx[target_product_id]
    except KeyError:
        print(f"⚠️ Target product {target_product_id} not found in index.")
        return []

    sim_scores = list(enumerate(cosine_sim_matrix[target_idx]))
    sim_scores = sorted(sim_scores, key=lambda x: x[1], reverse=True)
    sim_scores = sim_scores[1:4] # Get top 3, excluding self

    # Format the output
    substitutes = []
    for idx, score in sim_scores:
        if score > 0.1: # Only add if similarity is above a certain threshold
            substitute_product = df.iloc[idx]
            substitutes.append({
                "id": substitute_product['id'],
                "name": substitute_product['name'],
                "sku": substitute_product['sku'],
                "similarity": round(score, 2)
            })
            
    return substitutes

def get_procurement_recommendation(product, tariff_rate, demand_signal, weather_factor=0.0):
    """
    Analyzes various factors and returns a procurement recommendation using a corrected, rule-based engine.
    """
    rules_triggered = []
    
    # --- Scoring Logic (No changes here) ---
    cost_impact_score = -1 * (tariff_rate / 0.25)
    if tariff_rate > 0.15:
        rules_triggered.append(f"High tariff ({tariff_rate:.0%}) negatively impacts cost score.")
    elif tariff_rate > 0.05:
        rules_triggered.append(f"Medium tariff ({tariff_rate:.0%}) has moderate cost impact.")
    else:
        rules_triggered.append("Low or zero tariff has minimal cost impact.")

    demand_score = demand_signal
    if demand_score > 0.4:
        rules_triggered.append(f"Strong positive news sentiment (score: {demand_score:.2f}) indicates high demand.")
    elif demand_score < -0.4:
        rules_triggered.append(f"Strong negative news sentiment (score: {demand_score:.2f}) indicates low demand.")
    else:
        rules_triggered.append(f"Neutral news sentiment (score: {demand_score:.2f}) indicates stable demand.")

    inventory = product.get('inventory', {})
    stock = inventory.get('stock', 0)
    velocity = inventory.get('salesVelocity', 1)
    days_of_stock = stock / velocity if velocity > 0 else float('inf')
    
    urgency_score = 0
    if days_of_stock < 7:
        urgency_score = 1.0
        rules_triggered.append(f"Critically low inventory ({days_of_stock:.1f} days of stock remaining). High urgency.")
    elif days_of_stock < 30:
        urgency_score = 0.5
        rules_triggered.append(f"Low inventory ({days_of_stock:.1f} days of stock remaining). Medium urgency.")
    else:
        urgency_score = -0.5
        rules_triggered.append(f"Sufficient inventory ({days_of_stock:.1f} days of stock remaining). Low urgency.")

    if weather_factor >= 1.0:
        urgency_score += 0.2
        rules_triggered.append("Bad weather detected — slightly increasing urgency score.")


    # --- vvvvvv NEW AND CORRECTED DECISION LOGIC vvvvvv ---
    
    recommendation = "Monitor"  # Default recommendation

    # RULE 1: First, check for prohibitively high costs.
    # A very high cost should immediately suggest finding a substitute, unless inventory is so low we have no choice.
    if cost_impact_score < -0.8: # Corresponds to a tariff > 20%
        recommendation = "Use Substitute"
        rules_triggered.append("RULE: Extremely high cost from tariffs triggers USE SUBSTITUTE.")
    
    # RULE 2: The perfect storm for a bulk order - urgent, in-demand, AND affordable.
    elif urgency_score >= 1.0 and demand_score > 0.2 and cost_impact_score > -0.6:
        recommendation = "Bulk Order"
        rules_triggered.append("RULE: Critical urgency, positive demand AND acceptable cost trigger BULK ORDER.")
        
    # RULE 3: High demand is a strong signal, but let's check cost.
    elif demand_score > 0.4:
        if cost_impact_score < -0.6: # High demand, but high cost
            recommendation = "Use Substitute"
            rules_triggered.append("RULE: High demand but very high cost triggers USE SUBSTITUTE.")
        elif cost_impact_score < -0.2: # High demand, moderate cost
            recommendation = "Standard Order"
            rules_triggered.append("RULE: High demand with moderate cost triggers STANDARD ORDER.")
        else: # High demand, low cost
            recommendation = "Bulk Order"
            rules_triggered.append("RULE: High demand with low cost triggers BULK ORDER.")
            
    # RULE 4: Handle neutral demand situations based on urgency and cost.
    elif demand_score > -0.4:  # Neutral demand
        if urgency_score >= 1.0: # Urgent, neutral demand
            recommendation = "Standard Order"
            rules_triggered.append("RULE: Critical urgency with neutral demand triggers STANDARD ORDER.")
        elif urgency_score >= 0.5: # Medium urgency, neutral demand
            recommendation = "Monitor"
            rules_triggered.append("RULE: Medium urgency with neutral demand triggers MONITOR.")
        else: # Low urgency, neutral demand
            recommendation = "Hold"
            rules_triggered.append("RULE: Low urgency with neutral demand triggers HOLD.")
            
    # RULE 5: Handle low demand situations.
    else:  # Low demand
        if urgency_score >= 0.5: # Low demand but still somewhat urgent
            recommendation = "Monitor"
            rules_triggered.append("RULE: Low demand but medium urgency triggers MONITOR.")
        else: # Low demand and low urgency
            recommendation = "Deprioritize"
            rules_triggered.append("RULE: Low demand with low urgency triggers DEPRIORITIZE.")

    # --- ^^^^^^ END OF NEW LOGIC ^^^^^^ ---


    analysis_details = {
        "productId": product.get('id'),
        "productName": product.get('name'),
        "inputs": {
            "tariffRate": tariff_rate,
            "demandSignal": demand_signal,
            "weatherFactor": weather_factor,
            "inventoryLevel": stock,
            "salesVelocity": velocity,
            "daysOfStock": days_of_stock
        },
        "scores": {
            "costImpactScore": round(cost_impact_score, 2),
            "demandScore": round(demand_score, 2),
            "urgencyScore": round(urgency_score, 2)
        },
        "rulesTriggered": rules_triggered
    }

    print(f"📊 Final recommendation for {product.get('name')}: {recommendation}")
    return {
        "recommendation": recommendation,
        "analysis": analysis_details
    }