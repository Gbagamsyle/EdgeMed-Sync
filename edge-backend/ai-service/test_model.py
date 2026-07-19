import pytest
from model import predict


def test_hypertensive_prediction():
    result = predict({
        'heart_rate': 88,
        'systolic_bp': 162,
        'diastolic_bp': 102,
        'spo2': 96,
        'temperature': 36.8,
        'resp_rate': 17,
    })
    assert result['label'] == 'Hypertensive'
    assert result['confidence'] > 0.7
    assert 'guidance' in result
    assert len(result['guidance']) > 0


def test_febrile_prediction():
    result = predict({
        'heart_rate': 128,
        'systolic_bp': 115,
        'diastolic_bp': 75,
        'spo2': 96,
        'temperature': 39.5,
        'resp_rate': 20,
    })
    assert result['label'] == 'Febrile_Tachycardic'
    assert result['confidence'] > 0.7


def test_respiratory_prediction():
    result = predict({
        'heart_rate': 105,
        'systolic_bp': 115,
        'diastolic_bp': 74,
        'spo2': 88,
        'temperature': 37.5,
        'resp_rate': 28,
    })
    assert result['label'] == 'Respiratory_Compromise'
    assert result['confidence'] > 0.7


def test_normal_prediction():
    result = predict({
        'heart_rate': 72,
        'systolic_bp': 118,
        'diastolic_bp': 76,
        'spo2': 98,
        'temperature': 36.7,
        'resp_rate': 15,
    })
    assert result['label'] == 'Normal'
    assert result['confidence'] > 0.7


def test_missing_vitals_handled():
    result = predict({})
    assert 'label' in result
    assert 'confidence' in result


def test_all_four_classes_predicted():
    labels = set()
    test_cases = [
        {'heart_rate': 128, 'systolic_bp': 115, 'diastolic_bp': 75, 'spo2': 96, 'temperature': 39.5, 'resp_rate': 20},
        {'heart_rate': 88, 'systolic_bp': 162, 'diastolic_bp': 102, 'spo2': 96, 'temperature': 36.8, 'resp_rate': 17},
        {'heart_rate': 105, 'systolic_bp': 115, 'diastolic_bp': 74, 'spo2': 88, 'temperature': 37.5, 'resp_rate': 28},
        {'heart_rate': 72, 'systolic_bp': 118, 'diastolic_bp': 76, 'spo2': 98, 'temperature': 36.7, 'resp_rate': 15},
    ]
    for case in test_cases:
        labels.add(predict(case)['label'])
    assert len(labels) == 4
