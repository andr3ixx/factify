import json
import csv
import random
from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
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


@csrf_exempt
def process_data(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            select1 = data.get('select1')
            select2 = data.get('select2')
            select3 = data.get('select3')
            
            if select1 == 'test':
                csv_filename = 'detector/static/detector/datasets/test_data_prediksyon.csv'
            elif select1 == 'train':
                csv_filename = 'detector/static/detector/datasets/train_data_prediksyon.csv'
            else:
                return JsonResponse({'error': 'Invalid selection for Select 1'}, status=400)
            
            matching_rows = []
            with open(csv_filename, newline='') as csvfile:
                reader = csv.reader(csvfile)
                for row in reader:
                    if row[0] == select2 and row[1] == select3:
                        matching_rows.append(row[2])
            
            if not matching_rows:
                return JsonResponse({'error': 'No matching rows found'}, status=404)
            
            random_value = random.choice(matching_rows)
            return JsonResponse({'result': random_value})
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)
    else:
        return JsonResponse({'error': 'Method not allowed'}, status=405)