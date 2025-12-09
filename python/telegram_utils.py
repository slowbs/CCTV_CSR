import requests

TELEGRAM_BOT_TOKEN = '7725475514:AAESQ0vZWNyphDaa630sQaaLgvl7dMkCvuo'
# TELEGRAM_CHAT_ID = '6334503369'
TELEGRAM_CHAT_ID = '-5011497123'

def send_telegram_message(message):
    url = f'https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage'
    payload = {
        'chat_id': TELEGRAM_CHAT_ID,
        'text': message,
        'parse_mode': 'HTML'
    }
    response = requests.post(url, json=payload)
    if response.status_code != 200:
        print(f"Failed to send message: {response.text}")
    else:
        print("Message sent successfully!")
