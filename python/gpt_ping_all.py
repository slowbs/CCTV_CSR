import mysql.connector
import concurrent.futures
import subprocess

# ฟังก์ชันที่ใช้ในการ ping IP
def ping(data):
    ip = data['ip']
    result = subprocess.run(['ping', '-c', '1', ip], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    return data, result.returncode == 0

# เชื่อมต่อกับฐานข้อมูลและดึงข้อมูลทั้งหมดจากตาราง cctv
def get_cctv_data():
    connection = mysql.connector.connect(
        host='localhost',
        user='slowbs',
        password='1596321',
        database='cctv'
    )
    cursor = connection.cursor(dictionary=True)
    cursor.execute("SELECT * FROM cctv")
    rows = cursor.fetchall()
    connection.close()
    return rows

# ดึงข้อมูลทั้งหมดจากตาราง cctv
cctv_data = get_cctv_data()

# ใช้ concurrent.futures เพื่อทำการ ping พร้อมกัน โดยส่งข้อมูลทั้งหมด
with concurrent.futures.ThreadPoolExecutor() as executor:
    results = list(executor.map(ping, cctv_data))

# แสดงผลลัพธ์
for data, success in results:
    ip = data['ip']
    other_columns = ', '.join([f"{key}: {value}" for key, value in data.items() if key != 'ip'])
    status = "ตอบสนอง (reachable)" if success else "ไม่ตอบสนอง (unreachable)"
    print(f"IP: {ip}, {other_columns} - {status}")
