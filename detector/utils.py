import joblib
import re
import string
from nltk.stem import PorterStemmer
import json
import nltk

# Text preprocessing
def wordopt(text):
    text = text.lower()
    text = re.sub('https?://\S+|www\.\S+', '', text)
    text = re.sub('\[.*?\]', '', text)
    text = re.sub("\\W", " ", text)
    text = re.sub('<.*?>+', '', text)
    text = re.sub('[%s]' % re.escape(string.punctuation), '', text)
    text = re.sub('\n', '', text)
    text = re.sub('\w*\d\w*', '', text)
    return text

ps = PorterStemmer()
with open('detector/static/detector/models/stopwords-tl.json', 'r') as f:
    stopwords = json.load(f)

def preprocess(text):
    text = wordopt(text)
    tokens = nltk.word_tokenize(text)
    stems = [ps.stem(token) for token in tokens]
    filtered = [stem for stem in stems if stem not in stopwords]
    return filtered

def predict(text):
    processed = preprocess(text)

    # Load vectorizer
    vectorizer = joblib.load('detector/static/detector/models/vectorizer_mlp.joblib')

    text = ' '.join(processed)

    # Transform the validation data using the same vectorizer
    tfidf = vectorizer.transform([text])

    stack_model = joblib.load('detector/static/detector/models/stack_mlp.joblib')  # Update with your model path

    # Extract trained base models from the stacking model
    trained_base_models = stack_model.named_estimators_

    # Dictionary to store predictions with corresponding base model names
    base_models_predictions = {}

    # Iterate over each base model and make predictions
    for name, model in trained_base_models.items():
        # Make prediction using the loaded base model
        prediction = model.predict_proba(tfidf)[0]  # Assuming binary prediction (0 or 1)
        prob_false = prediction[0]  # Probability for class 0
        prob_true = prediction[1]   # Probability for class 1
        
        # Store the prediction along with the base model name
        base_models_predictions[name] = (prob_false, prob_true)

    # Make prediction using the loaded model
    prediction = stack_model.predict_proba(tfidf)[0]  # Assuming binary prediction (0 or 1)
    
    prob_false = prediction[0]  # Probability for class 0
    prob_true = prediction[1] # Probability for class 1

    return prob_false, prob_true, base_models_predictions

