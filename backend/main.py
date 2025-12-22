from flask import Flask, jsonify, request, abort
import json
import os

app = Flask(__name__)

TASKS_DIR = "."   # json лежат рядом с main.py


# -----------------------------
# Вспомогательные функции
# -----------------------------

def load_task(task_id: str):
    """Загружает JSON файл вида Tack_1.json"""
    filename = f"Tack_{task_id}.json"
    path = os.path.join(TASKS_DIR, filename)

    if not os.path.exists(path):
        print("NOT FOUND:", path)
        return None

    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def get_question(task, question_id):
    return task["questions"].get(question_id)


def get_events(task, block_name):
    return task["events"].get(block_name, [])


# -----------------------------
# GET /tasks/<task_id>
# -----------------------------

@app.route("/tasks/<task_id>", methods=["GET"])
def get_task(task_id):
    task = load_task(task_id)
    if not task:
        abort(404)

    initial_question_id = task["initialQuestionId"]
    question_data = task["questions"][initial_question_id]
    
    # ГАРАНТИРУЕМ, что поле id будет в ответе
    question_response = {
        "id": initial_question_id,  # всегда добавляем
        "text": question_data.get("text", ""),
        "options": question_data.get("options", []),
        "correct": question_data.get("correct", 0)
    }
    
    # Добавляем все остальные поля из исходных данных
    for key, value in question_data.items():
        if key not in question_response:
            question_response[key] = value
    
    response = {
        "id": task["id"],
        "title": task["title"],
        "description": task.get("description"),
        "question": question_response,
        "events": task["events"]["initial"]
    }

    return jsonify(response)
# -----------------------------
# POST /tasks/<task_id>/answer
# -----------------------------

@app.route("/tasks/<task_id>/answer", methods=["POST"])
def answer(task_id):
    task = load_task(task_id)
    if not task:
        abort(404)

    data = request.get_json()
    if not data:
        abort(400)

    answer_index = data.get("answer")
    question_id = data.get("questionId")

    question = get_question(task, question_id)
    if not question:
        return jsonify({"status": "error", "message": "Unknown questionId"}), 400

    # Проверка ответа
    is_correct = (answer_index == question["correct"])

    # Определяем имя блока
    block_correct = f"{question_id}_correct"
    block_wrong = f"{question_id}_wrong"

    events = get_events(task, block_correct if is_correct else block_wrong)

    # Определяем следующий вопрос
    next_question_id = None
    if question_id == "q1":
        next_question_id = "q2"
    elif question_id == "q2":
        next_question_id = "q3"
    else:
        next_question_id = None  # q3 → конец

    # Последний вопрос
    if next_question_id is None:
        return jsonify({
            "status": "win" if is_correct else "lose",
            "statusMessage": "Сценарий завершён.",
            "message": "Правильный ответ!" if is_correct else "Неверный ответ.",
            "events": events
        })

    # Продолжение сценария
    next_question = task["questions"][next_question_id]

    return jsonify({
        "status": "continue",
        "message": "Ответ принят.",
        "question": next_question,
        "events": events
    })


# -----------------------------
# Старт
# -----------------------------
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
