import pandas as pd
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.preprocessing import StandardScaler

def find_substitutes(target_product_id, all_products):
    """
    Finds similar products based on their features using cosine similarity.
    """
    if not all_products:
        return

    # Create a DataFrame from the product list
    df = pd.DataFrame(all_products)

    # Extract nested feature and inventory data
    features_df = pd.json_normalize(df['features'])
    inventory_df = pd.json_normalize(df['inventory'])
    df = pd.concat([df.drop(['features', 'inventory', 'imageUrl'], axis=1), features_df, inventory_df], axis=1)

    # --- Feature Engineering ---
    # Select features for similarity calculation
    # For a robust model, more feature engineering would be needed here
    features_for_similarity = ['category', 'price', 'type', 'size_oz', 'brand']
    
    # Create a dataframe with only the features we need, and handle missing values
    df_features = df[['id'] + features_for_similarity].copy()
    df_features.set_index('id', inplace=True)

    # One-Hot Encode categorical features
    categorical_cols = df_features.select_dtypes(include=['object', 'category']).columns
    df_encoded = pd.get_dummies(df_features, columns=categorical_cols, dummy_na=True)

    # Scale numerical features
    numerical_cols = df_encoded.select_dtypes(include=['number']).columns
    scaler = StandardScaler()
    df_encoded[numerical_cols] = scaler.fit_transform(df_encoded[numerical_cols])

    # --- Cosine Similarity Calculation ---
    cosine_sim_matrix = cosine_similarity(df_encoded, df_encoded)
    
    # Create a mapping from product ID to its index in the dataframe
    id_to_idx = pd.Series(df_encoded.index)
    indices = pd.Series(df_encoded.index, index=df_encoded.index).drop_duplicates()
    
    try:
        target_idx = indices[target_product_id]
    except KeyError:
        return # Target product not found

    # Get the pairwise similarity scores for the target product
    sim_scores = list(enumerate(cosine_sim_matrix[target_idx]))
    
    # Sort the products based on the similarity scores
    sim_scores = sorted(sim_scores, key=lambda x: x, reverse=True)
    
    # Get the scores of the top 3 most similar products (excluding itself, which is at index 0)
    sim_scores = sim_scores[1:4]
    
    # Get the product indices
    product_indices = [i for i in sim_scores]
    
    # Get the actual product IDs from the indices
    similar_product_ids = id_to_idx.iloc[product_indices].tolist()

    # Format the output
    substitutes = []
    for i, score in zip(similar_product_ids, [s for s in sim_scores]):
        substitute_product = df[df['id'] == i].to_dict('records')
        if substitute_product:
            substitute_product = substitute_product[0]
            substitutes.append({
                "id": substitute_product['id'],
                "name": substitute_product['name'],
                "sku": substitute_product['sku'],
                "similarity": round(score[1], 2)
            })
        
    return substitutes

def get_procurement_recommendation(product, tariff_rate, demand_signal):
    """
    Analyzes various factors and returns a procurement recommendation using a rule-based engine.
    """
    rules_triggered = []
    
    # --- Scoring Logic ---
    # Normalize inputs into scores from -1.0 to 1.0

    # Cost Impact Score: Higher tariff means more negative impact
    cost_impact_score = -1 * (tariff_rate / 0.25) # Normalize based on a max expected tariff of 25%
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
    velocity = inventory.get('salesVelocity', 1) # Avoid division by zero
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

    # --- Decision Logic (Rule Engine) ---
    recommendation = "Monitor" # Default recommendation

    if urgency_score >= 1.0 and demand_score > 0:
        recommendation = "Bulk Order"
        rules_triggered.append("RULE: Critical urgency and positive demand trigger BULK ORDER.")
    elif demand_score > 0.4:
        if cost_impact_score < -0.6: # Corresponds to >15% tariff
            recommendation = "Use Substitute"
            rules_triggered.append("RULE: High demand but very high cost triggers USE SUBSTITUTE.")
        elif cost_impact_score < -0.2: # Corresponds to >5% tariff
            recommendation = "Standard Order"
            rules_triggered.append("RULE: High demand with moderate cost triggers STANDARD ORDER.")
        else:
            recommendation = "Bulk Order"
            rules_triggered.append("RULE: High demand with low cost triggers BULK ORDER.")
    elif demand_score > -0.4: # Neutral demand
        if cost_impact_score < -0.6:
            recommendation = "Hold"
            rules_triggered.append("RULE: Neutral demand with high cost triggers HOLD.")
        elif urgency_score > 0.5:
             recommendation = "Standard Order"
             rules_triggered.append("RULE: Neutral demand but medium urgency triggers STANDARD ORDER.")
        else:
            recommendation = "Monitor"
            rules_triggered.append("RULE: Neutral demand with low cost and urgency triggers MONITOR.")
    else: # Low demand
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

    return {
        "recommendation": recommendation,
        "analysis": analysis_details
    }