-- PSRU Sports Database Schema & Initial Seed Data

-- 1. Create Database if not exists
CREATE DATABASE IF NOT EXISTS psru_sports DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE psru_sports;

-- 2. Create tables
CREATE TABLE IF NOT EXISTS campuses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NULL,
    phone VARCHAR(20) NULL,
    role ENUM('student', 'staff', 'admin') NOT NULL,
    status ENUM('normal', 'suspended') DEFAULT 'normal' NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS blacklist_records (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    reason VARCHAR(255) NOT NULL,
    suspended_from DATE NOT NULL,
    suspended_until DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_blacklist_users FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS courts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    campus_id INT NOT NULL,
    name VARCHAR(150) NOT NULL,
    sport_type ENUM('futsal', 'badminton', 'football', 'tennis', 'basketball') NOT NULL,
    description TEXT NULL,
    location_type ENUM('indoor', 'outdoor') NOT NULL,
    status ENUM('ready', 'maintenance', 'closed') DEFAULT 'ready' NOT NULL,
    opening_time TIME NOT NULL DEFAULT '08:00:00',
    closing_time TIME NOT NULL DEFAULT '21:00:00',
    max_booking_hours_per_day INT DEFAULT 1 NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_courts_campuses FOREIGN KEY (campus_id) REFERENCES campuses(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS court_images (
    id INT AUTO_INCREMENT PRIMARY KEY,
    court_id INT NOT NULL,
    image_url VARCHAR(255) NOT NULL,
    is_primary BOOLEAN DEFAULT FALSE NOT NULL,
    CONSTRAINT fk_images_courts FOREIGN KEY (court_id) REFERENCES courts(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS court_facilities (
    id INT AUTO_INCREMENT PRIMARY KEY,
    court_id INT NOT NULL,
    facility_name VARCHAR(100) NOT NULL,
    CONSTRAINT fk_facilities_courts FOREIGN KEY (court_id) REFERENCES courts(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS bookings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    booking_code VARCHAR(20) UNIQUE NOT NULL,
    user_id INT NOT NULL,
    court_id INT NOT NULL,
    booking_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    booking_title VARCHAR(255) NOT NULL,
    additional_request TEXT NULL,
    status ENUM('pending', 'approved', 'rejected', 'completed', 'cancelled') DEFAULT 'pending' NOT NULL,
    approved_by INT NULL,
    rejection_reason TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_bookings_users FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_bookings_courts FOREIGN KEY (court_id) REFERENCES courts(id) ON DELETE CASCADE,
    CONSTRAINT fk_bookings_staff FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS reports (
    id INT AUTO_INCREMENT PRIMARY KEY,
    staff_id INT NOT NULL,
    court_id INT NOT NULL,
    description TEXT NOT NULL,
    status ENUM('pending', 'resolved') DEFAULT 'pending' NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_reports_staff FOREIGN KEY (staff_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_reports_courts FOREIGN KEY (court_id) REFERENCES courts(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS news (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    priority ENUM('normal', 'warning', 'critical') DEFAULT 'normal' NOT NULL,
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_news_admin FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS court_closures (
    id INT AUTO_INCREMENT PRIMARY KEY,
    court_id INT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    start_time TIME NULL,
    end_time TIME NULL,
    reason VARCHAR(255) NOT NULL,
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_closures_court FOREIGN KEY (court_id) REFERENCES courts(id) ON DELETE CASCADE,
    CONSTRAINT fk_closures_user FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Indexes
CREATE INDEX idx_bookings_date_time ON bookings(court_id, booking_date, start_time);
CREATE INDEX idx_closures_court_date ON court_closures(court_id, start_date, end_date);
CREATE INDEX idx_courts_campus_sport ON courts(campus_id, sport_type);
CREATE INDEX idx_users_username ON users(username);

-- 4. Seed Data
-- 4.1 Campuses
INSERT INTO campuses (id, name) VALUES 
(1, 'ศูนย์ทะเลแก้ว'),
(2, 'ศูนย์ส่วนวังจันทน์')
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- 4.2 Users (Password is '123456' for all default accounts)
-- bcrypt hash of '123456': $2y$10$W7GlYjlHSV9zhICYvJz2Ve4m8IVLsUT/kjUR3fXqAHzYoqQRNURqG (verified)
INSERT INTO users (id, username, password_hash, first_name, last_name, email, phone, role, status) VALUES
(1, '640000001', '$2y$10$W7GlYjlHSV9zhICYvJz2Ve4m8IVLsUT/kjUR3fXqAHzYoqQRNURqG', 'สมชาย', 'มีชัย', 'somshai@psru.ac.th', '0812345678', 'student', 'normal'),
(2, 'staff01', '$2y$10$W7GlYjlHSV9zhICYvJz2Ve4m8IVLsUT/kjUR3fXqAHzYoqQRNURqG', 'พรชัย', 'กีฬาดี', 'staff@psru.ac.th', '0898765432', 'staff', 'normal'),
(3, 'admin', '$2y$10$W7GlYjlHSV9zhICYvJz2Ve4m8IVLsUT/kjUR3fXqAHzYoqQRNURqG', 'แอดมินสูงสุด', 'PSRU', 'admin@psru.ac.th', '0800000000', 'admin', 'normal')
ON DUPLICATE KEY UPDATE username=VALUES(username);

-- 4.3 Courts
INSERT INTO courts (id, campus_id, name, sport_type, description, location_type, status, opening_time, closing_time, max_booking_hours_per_day) VALUES
(1, 1, 'สนามฟุตซอล อาคารเอนกประสงค์', 'futsal', 'พื้นยางพารามาตรฐาน สำหรับฝึกซ้อมและออกกำลังกายเพื่อสุขภาพ', 'indoor', 'ready', '08:00:00', '21:00:00', 1),
(2, 1, 'คอร์ทแบดมินตัน (คอร์ท 1-4)', 'badminton', 'คอร์ทแบดมินตันพื้นปาร์เก้ขัดเงามาตรฐาน พร้อมเสาและตาข่าย มีระบบแสงไฟบริการที่เพียงพอสำหรับรอบเย็น', 'indoor', 'ready', '08:00:00', '21:00:00', 1),
(3, 1, 'สนามฟุตบอล 1 (สนามหลัก)', 'football', 'สนามหญ้าจริงขนาดมาตรฐาน สำหรับการทำกิจกรรมคณะหรือแข่งขันภายใน', 'outdoor', 'ready', '08:00:00', '21:00:00', 1),
(4, 2, 'สนามเทนนิส ศูนย์วังจันทน์', 'tennis', 'Hard Court บรรยากาศร่มรื่นข้างแม่น้ำน่าน สำหรับนักศึกษาส่วนวังจันทน์', 'outdoor', 'ready', '08:00:00', '21:00:00', 1)
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- 4.4 Court Facilities
INSERT INTO court_facilities (court_id, facility_name) VALUES
(1, 'ระบบไฟส่องสว่าง'), (1, 'ระบายอากาศดี'), (1, 'มีอัฒจันทร์เชียร์'),
(2, 'ระบบไฟส่องสว่าง'), (2, 'ระบายอากาศดี'), (2, 'มีเจ้าหน้าที่ดูแล'),
(3, 'ระบบไฟสปอตไลท์'), (3, 'มีอัฒจันทร์ขนาดใหญ่'), (3, 'ห้องน้ำ/ห้องอาบน้ำ'),
(4, 'ไฟส่องสว่างสนาม'), (4, 'รั้วกั้นนิรภัยรอบด้าน'), (4, 'วิวธรรมชาติริมแม่น้ำ')
ON DUPLICATE KEY UPDATE facility_name=VALUES(facility_name);

-- 4.5 Initial News
INSERT INTO news (id, title, content, priority, created_by) VALUES
(1, 'ยินดีต้อนรับสู่ระบบจองสนามกีฬา PSRU Sports', 'ระบบเปิดใช้งานสำหรับการทดสอบจองสิทธิ์เล่นกีฬาของนักศึกษา มรภ.พิบูลสงคราม ประจำปีการศึกษา 2026', 'normal', 3)
ON DUPLICATE KEY UPDATE title=VALUES(title);
