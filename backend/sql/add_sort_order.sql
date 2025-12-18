-- ===================================
-- SQL สำหรับเพิ่ม sort_order ใน cctv_maps
-- ===================================

-- Step 1: เพิ่มคอลัมน์ sort_order
ALTER TABLE `cctv_maps` ADD COLUMN `sort_order` INT DEFAULT 0 AFTER `image`;

-- Step 2: อัพเดตค่า sort_order ให้เท่ากับ id (เริ่มต้น)
UPDATE `cctv_maps` SET `sort_order` = `id`;

-- ตรวจสอบผลลัพธ์
-- SELECT id, name, sort_order FROM cctv_maps ORDER BY sort_order;
