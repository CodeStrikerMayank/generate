import urllib.request
import json

if __name__ == '__main__':
    # 1. Register a test student
    req = urllib.request.Request(
        'http://127.0.0.1:8000/api/auth/register',
        data=json.dumps({
            'name': 'AdvTester',
            'email': 'advtester@example.com',
            'password': 'password123',
            'target_exam': 'JEE'
        }).encode(),
        headers={'Content-Type': 'application/json'}
    )
    student = json.loads(urllib.request.urlopen(req).read().decode())
    std_id = student['student_id']
    print('Registered student:', std_id)

    # 2. Call start-advanced
    req2 = urllib.request.Request(
        f'http://127.0.0.1:8000/api/assessments/start-advanced?student_id={std_id}&exam=JEE',
        data=b'',
        headers={'Content-Type': 'application/json'}
    )
    asmt = json.loads(urllib.request.urlopen(req2).read().decode())
    print('Assessment started!')
    print('Title:', asmt['title'])
    print('Test Tier:', asmt['test_tier'])
    print('Total Qs:', asmt['total_questions'])
    for q in asmt['questions']:
        print(' ', q['subject'], q['question_id'], 'Diff:', q['difficulty'], '-', q['topic'])
