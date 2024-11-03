import mysql.connector
import concurrent.futures
import subprocess
import platform

# ฟังก์ชันที่ใช้ในการ ping IP และตรวจสอบค่าสถานะการ ping กับข้อมูลในคอลัมน์ ping
def ping_and_check(data):
    ip = data['ip']
    id_ = data['id']
    ping_value = data['ping']  # ค่าปัจจุบันของคอลัมน์ ping ในฐานข้อมูล

    # ตรวจสอบระบบปฏิบัติการและเลือกคำสั่ง ping ที่เหมาะสม
    param_count = '-n' if platform.system().lower() == 'windows' else '-c'
    param_timeout = '-w' if platform.system().lower() == 'windows' else '-W'
    
    # ทำการ ping IP โดยกำหนด Timeout เป็น 500 ms
    result = subprocess.run(['ping', param_count, '1', param_timeout, '500', ip],
                            stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    success = result.returncode == 0
    
    # ตรวจสอบเงื่อนไขและส่งผลลัพธ์กลับ
    if success and ping_value == 0:
        status = "ปกติ (สถานะการ ping ตอบสนอง และคอลัมน์ ping = 0)"
    elif not success and ping_value == 1:
        status = "ไม่ตอบสนอง (สถานะการ ping ไม่ตอบสนอง และคอลัมน์ ping = 1)"
    else:
        # กรณีสถานะการ ping ไม่ตรงกับค่าที่บันทึกไว้ในคอลัมน์ ping
        status = "สถานะไม่สอดคล้อง (ค่าสถานะการ ping ไม่ตรงกับค่าคอลัมน์ ping)"
        
        # ทำการอัปเดต count_ping ในฐานข้อมูล
        update_count_ping(id_, success)

    return data, status

# ฟังก์ชันในการอัปเดต count_ping ในฐานข้อมูล
def update_count_ping(id_, success):
    connection = mysql.connector.connect(
        host='localhost',
        user='slowbs',
        password='1596321',
        database='cctv'
    )
    cursor = connection.cursor()
    
    # คำสั่ง SQL สำหรับอัปเดต count_ping
    sql_update_query = "UPDATE cctv SET count_ping = count_ping + 1 WHERE id = %s"
    cursor.execute(sql_update_query, (id_,))
    
    # ตรวจสอบค่า count_ping หลังการอัปเดต
    cursor.execute("SELECT count_ping FROM cctv WHERE id = %s", (id_,))
    count_ping = cursor.fetchone()[0]

    if count_ping > 2:
        # อัปเดตค่า ping ตามสถานะของการ ping
        new_ping_value = 1 if not success else 0
        sql_ping_update = "UPDATE cctv SET ping = %s, count_ping = 0 WHERE id = %s"
        cursor.execute(sql_ping_update, (new_ping_value, id_))
    
    connection.commit()  # ยืนยันการเปลี่ยนแปลง
    cursor.close()
    connection.close()

# เชื่อมต่อกับฐานข้อมูลและดึงข้อมูลเฉพาะคอลัมน์ id, durable_no, ip, ping จากตาราง cctv
def get_cctv_data():
    connection = mysql.connector.connect(
        host='localhost',
        user='slowbs',
        password='1596321',
        database='cctv'
    )
    cursor = connection.cursor(dictionary=True)
    cursor.execute("SELECT id, durable_no, ip, ping, count_ping FROM cctv")  # เพิ่ม count_ping เพื่อดึงข้อมูล
    rows = cursor.fetchall()
    connection.close()
    return rows

# ดึงข้อมูลจากตาราง cctv เฉพาะคอลัมน์ที่ต้องการ
cctv_data = get_cctv_data()

# ใช้ concurrent.futures เพื่อทำการ ping และตรวจสอบสถานะพร้อมกัน โดยเพิ่มจำนวน Threads
with concurrent.futures.ThreadPoolExecutor(max_workers=50) as executor:
    results = list(executor.map(ping_and_check, cctv_data))

# แสดงผลลัพธ์
for data, status in results:
    id_ = data['id']
    durable_no = data['durable_no']
    ip = data['ip']
    print(f"ID: {id_}, Durable No: {durable_no}, IP: {ip} - {status}")
