import mysql.connector
import concurrent.futures
import subprocess
import platform
import requests
import time

# ตั้งค่า LINE Notify token
LINE_NOTIFY_TOKEN = '2o8uKi8xrEoTYDmGHuEW6W2j7oxY8bheDApgfYRUJo4'

# ฟังก์ชันส่งการแจ้งเตือนไปยัง LINE Notify
def send_line_notification(message):
    url = 'https://notify-api.line.me/api/notify'
    headers = {
        'Authorization': f'Bearer {LINE_NOTIFY_TOKEN}'
    }
    data = {
        'message': message
    }
    requests.post(url, headers=headers, data=data)

# ฟังก์ชันสำหรับการเชื่อมต่อฐานข้อมูล
def get_db_connection():
    return mysql.connector.connect(
        host='localhost',
        user='slowbs',
        password='1596321',
        database='cctv'
    )

# ฟังก์ชันที่ใช้ในการ ping IP และตรวจสอบค่าสถานะการ ping กับข้อมูลในคอลัมน์ ping
def ping_and_check(data):
    ip = data['ip']
    id_ = data['id']
    ping_value = data['ping']
    count_ping = data['count_ping']
    cctv_type = data['type']
    floor_name = data['floor_name']
    durable_no = data['durable_no']
    durable_name = data['durable_name']
    location = data['location']

    param_count = '-n' if platform.system().lower() == 'windows' else '-c'
    param_timeout = '-w' if platform.system().lower() == 'windows' else '-W'
    
    result = subprocess.run(['ping', param_count, '1', param_timeout, '500', ip],
                            stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    success = result.returncode == 0
    
    if success and ping_value == 1:
        count_ping += 1
        status = "สถานะไม่สอดคล้อง (ตอบสนอง แต่คอลัมน์ ping = 1)"
    elif not success and ping_value == 0:
        count_ping += 1
        status = "สถานะไม่สอดคล้อง (ไม่ตอบสนอง แต่คอลัมน์ ping = 0)"
    else:
        if count_ping > 0:
            count_ping -= 1
        status = "สถานะตรงกัน (ไม่มีการเปลี่ยนแปลงค่า count_ping)"

    status_changed = update_status(id_, success, ping_value, count_ping, ip, cctv_type, durable_no, durable_name, location, floor_name)

    return data, status, success, status_changed

# ฟังก์ชันในการอัปเดตสถานะในฐานข้อมูลและบันทึก log
def update_status(id_, success, ping_value, count_ping, ip, cctv_type, durable_no, durable_name, location, floor_name):
    connection = get_db_connection()
    cursor = connection.cursor()
    status_changed = False

    try:
        cursor.execute("UPDATE cctv SET count_ping = %s WHERE id = %s", (count_ping, id_))

        if count_ping > 2:
            new_ping_value = 1 if not success else 0
            if new_ping_value != ping_value:
                cursor.execute("UPDATE cctv SET ping = %s, count_ping = 0 WHERE id = %s", (new_ping_value, id_))
                
                message = (
                    f"{'กลับมาออนไลน์' if new_ping_value == 0 else 'ออฟไลน์'}\n"
                    f"หมายเลขครุภัณฑ์ : {durable_no}\n"
                    f"รายการ : {durable_name}\n"
                    f"อาคาร : {floor_name}\n"
                    f"สถานที่ : {location}\n"
                    f"หมายเลข IP : {ip}\n"
                    f"สถานะ : {'ออนไลน์' if new_ping_value == 0 else 'ออฟไลน์'}"
                )
                send_line_notification(message)

                log_ping_status(id_, new_ping_value, cctv_type)
                
                status_changed = True

        connection.commit()
    finally:
        cursor.close()
        connection.close()

    return status_changed

# ฟังก์ชันบันทึกการเปลี่ยนแปลงสถานะลงใน log_ping
def log_ping_status(cctv_id, ping_checked, cctv_type):
    connection = get_db_connection()
    cursor = connection.cursor()

    try:
        cursor.execute(
            "INSERT INTO log_ping (cctv_id, ping_checked, type) VALUES (%s, %s, %s)",
            (cctv_id, ping_checked, cctv_type)
        )
        connection.commit()
    finally:
        cursor.close()
        connection.close()

# ฟังก์ชันดึงข้อมูลจากฐานข้อมูล โดยการ JOIN ตาราง cctv กับ floor
def get_cctv_data():
    connection = get_db_connection()
    cursor = connection.cursor(dictionary=True)

    try:
        cursor.execute("""
            SELECT cctv.id, cctv.durable_no, cctv.ip, cctv.ping, cctv.count_ping, cctv.type, cctv.durable_name, 
                   cctv.location, floor.floor_name
            FROM cctv
            JOIN floor ON cctv.floor = floor.floor_id
        """)
        rows = cursor.fetchall()
    finally:
        cursor.close()
        connection.close()

    return rows

# ทำงานแบบ loop ทุก ๆ 2 นาที
while True:
    cctv_data = get_cctv_data()

    responsive_count = 0
    non_responsive_count = 0
    status_changed_count = 0

    with concurrent.futures.ThreadPoolExecutor(max_workers=50) as executor:
        results = list(executor.map(ping_and_check, cctv_data))

    for data, status, success, status_changed in results:
        id_ = data['id']
        durable_no = data['durable_no']
        ip = data['ip']
        cctv_type = data['type']
        durable_name = data['durable_name']
        location = data['location']
        floor_name = data['floor_name']
        
        print(f"ID: {id_}, Durable No: {durable_no}, IP: {ip}, Type: {cctv_type}, Durable Name: {durable_name}, Location: {location}, Floor: {floor_name} - {status}")
        
        if success:
            responsive_count += 1
        else:
            non_responsive_count += 1

        if status_changed:
            status_changed_count += 1

    print(f"จำนวนอุปกรณ์ที่ตอบสนอง: {responsive_count}")
    print(f"จำนวนอุปกรณ์ที่ไม่ตอบสนอง: {non_responsive_count}")
    print(f"จำนวนอุปกรณ์ที่เปลี่ยนแปลงสถานะ: {status_changed_count}")

    time.sleep(120)
