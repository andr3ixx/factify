import json
from django.shortcuts import render
from django.http import JsonResponse
from .utils import predict

def home(request):
    return render(request, 'home.html')

def analyze_text(request):
    if request.method == 'POST':
        text = request.POST.get('text', '')
        try:
            data = json.loads(request.body)
            text = data.get('text', '')
            
            if text:
                # Process text, preprocess, and make predictions here
                prob_false, prob_true,base_models_predictions = predict(text)
                return JsonResponse({'false': prob_false,'true': prob_true, 'predictions':base_models_predictions})
            else:
                return JsonResponse({'error': 'No text received.'}, status=400)
        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON payload.'}, status=400)
        
    return JsonResponse({}, status=400)
