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
    Analyzes various factors and returns a procurement recommendation using a rule-based engine.
    """
    rules_triggered = []
    
    # --- Scoring Logic ---
    # Normalize inputs into scores from -1.0 to 1.0

    # Cost Impact Score: Higher tariff means more negative impact
    cost_impact_score = -1 * (tariff_rate / 0.25)  # Normalize based on a max expected tariff of 25%
    if tariff_rate > 0.15:
        rules_triggered.append(f"High tariff ({tariff_rate:.0%}) negatively impacts cost score.")
    elif tariff_rate > 0.05:
        rules_triggered.append(f"Medium tariff ({tariff_rate:.0%}) has moderate cost impact.")
    else:
        rules_triggered.append("Low or zero tariff has minimal cost impact.")

    # Demand Score is already between -1 and 1
    demand_score = demand_signal
    if demand_score > 0.4:
        rules_triggered.append(f"Strong positive news sentiment (score: {demand_score:.2f}) indicates high demand.")
    elif demand_score < -0.4:
        rules_triggered.append(f"Strong negative news sentiment (score: {demand_score:.2f}) indicates low demand.")
    else:
        rules_triggered.append(f"Neutral news sentiment (score: {demand_score:.2f}) indicates stable demand.")

    # Urgency Score: based on inventory vs. sales velocity
    inventory = product.get('inventory', {})
    stock = inventory.get('stock', 0)
    velocity = inventory.get('salesVelocity', 1)  # Avoid division by zero
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

    # Weather adjustment (experimental logic)
    if weather_factor >= 1.0:
        urgency_score += 0.2
        rules_triggered.append("Bad weather detected — slightly increasing urgency score.")
    elif weather_factor <= 0:
        rules_triggered.append("No adverse weather — no urgency adjustment.")

    # --- Decision Logic (Rule Engine) ---
    recommendation = "Monitor"  # Default recommendation

    if urgency_score >= 1.0 and demand_score > 0:
        recommendation = "Bulk Order"
        rules_triggered.append("RULE: Critical urgency and positive demand trigger BULK ORDER.")
    elif demand_score > 0.4:
        if cost_impact_score < -0.6:
            recommendation = "Use Substitute"
            rules_triggered.append("RULE: High demand but very high cost triggers USE SUBSTITUTE.")
        elif cost_impact_score < -0.2:
            recommendation = "Standard Order"
            rules_triggered.append("RULE: High demand with moderate cost triggers STANDARD ORDER.")
        else:
            recommendation = "Bulk Order"
            rules_triggered.append("RULE: High demand with low cost triggers BULK ORDER.")
    elif demand_score > -0.4:  # Neutral demand
        if cost_impact_score < -0.6:
            recommendation = "Hold"
            rules_triggered.append("RULE: Neutral demand with high cost triggers HOLD.")
        elif urgency_score > 0.5:
            recommendation = "Standard Order"
            rules_triggered.append("RULE: Neutral demand but medium urgency triggers STANDARD ORDER.")
        else:
            recommendation = "Monitor"
            rules_triggered.append("RULE: Neutral demand with low cost and urgency triggers MONITOR.")
    else:  # Low demand
        if cost_impact_score < -0.2:
            recommendation = "Deprioritize"
            rules_triggered.append("RULE: Low demand with any significant cost triggers DEPRIORITIZE.")
        else:
            recommendation = "Hold"
            rules_triggered.append("RULE: Low demand with low cost triggers HOLD.")

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
