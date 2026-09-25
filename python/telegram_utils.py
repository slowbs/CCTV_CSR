import os
import sys
import json
import requests

def _load_config():
    candidates = []
    if getattr(sys, 'frozen', False):
        candidates.append(os.path.join(os.path.dirname(sys.executable), 'telegram_config.json'))
    
    current_dir = os.path.dirname(os.path.abspath(__file__))
    candidates.append(os.path.join(current_dir, 'telegram_config.json'))
    candidates.append(os.path.abspath(os.path.join(current_dir, '..', 'telegram_config.json')))
    candidates.append(os.path.join(os.getcwd(), 'telegram_config.json'))

    for path in candidates:
        if os.path.isfile(path):
            try:
                with open(path, 'r', encoding='utf-8') as f:
                    return json.load(f)
            except Exception as e:
                print(f"Error reading {path}: {e}")
    return {}

_config = _load_config()
TELEGRAM_BOT_TOKEN = _config.get('bot_token', '')
TELEGRAM_CHAT_ID = _config.get('chat_id', '-5011497123')

def send_telegram_message(message):
    global TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID
    if not TELEGRAM_BOT_TOKEN or TELEGRAM_BOT_TOKEN == 'YOUR_NEW_BOT_TOKEN_HERE':
        cfg = _load_config()
        TELEGRAM_BOT_TOKEN = cfg.get('bot_token', '')
        TELEGRAM_CHAT_ID = cfg.get('chat_id', '-5011497123')
        if not TELEGRAM_BOT_TOKEN or TELEGRAM_BOT_TOKEN == 'YOUR_NEW_BOT_TOKEN_HERE':
            print("Telegram Bot Token is not configured. Please set it in telegram_config.json")
            return False

    url = f'https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage'
    payload = {
        'chat_id': TELEGRAM_CHAT_ID,
        'text': message,
        'parse_mode': 'HTML'
    }
    try:
        response = requests.post(url, json=payload, timeout=10)
        if response.status_code != 200:
            print(f"Failed to send message: {response.text}")
            return False
        else:
            print("Message sent successfully!")
            return True
    except Exception as e:
        print(f"Telegram send error: {e}")
        return False

