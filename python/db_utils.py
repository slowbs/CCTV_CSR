import mysql.connector
import datetime

def get_db_connection():
    return mysql.connector.connect(
        host='localhost',
        user='slowbs',
        password='1596321',
        database='cctv'
    )

def get_cctv_data():
    connection = get_db_connection()
    cursor = connection.cursor(dictionary=True)
    try:
        cursor.execute("""
            SELECT cctv.id, cctv.durable_no, cctv.ip, cctv.ping, cctv.count_ping, cctv.type, 
                   cctv.durable_name, cctv.location, cctv.monitor, floor.floor_name, cctv.maintenance_mode
            FROM cctv 
            JOIN floor ON cctv.floor = floor.floor_id
        """)
        rows = cursor.fetchall()
    finally:
        cursor.close()
        connection.close()
    return rows

def update_device_status(id_, new_ping_value, count_ping):
    connection = get_db_connection()
    cursor = connection.cursor()
    try:
        cursor.execute("UPDATE cctv SET ping = %s, count_ping = %s WHERE id = %s", (new_ping_value, count_ping, id_))
        connection.commit()
    finally:
        cursor.close()
        connection.close()

def update_device_count_ping(id_, count_ping):
    connection = get_db_connection()
    cursor = connection.cursor()
    try:
        cursor.execute("UPDATE cctv SET count_ping = %s WHERE id = %s", (count_ping, id_))
        connection.commit()
    finally:
        cursor.close()
        connection.close()

def log_ping_status(cctv_id, ping_checked, cctv_type):
    connection = get_db_connection()
    cursor = connection.cursor()
    try:
        cursor.execute("INSERT INTO log_ping (cctv_id, ping_checked, type, comment, date_created) VALUES (%s, %s, %s, %s, %s)",
                       (cctv_id, ping_checked, cctv_type, "", datetime.datetime.now()))
        connection.commit()
    finally:
        cursor.close()
        connection.close()

def set_maintenance_mode(id_, mode):
    connection = get_db_connection()
    cursor = connection.cursor()
    try:
        cursor.execute("UPDATE cctv SET maintenance_mode = %s WHERE id = %s", (mode, id_))
        connection.commit()
    finally:
        cursor.close()
        connection.close()
