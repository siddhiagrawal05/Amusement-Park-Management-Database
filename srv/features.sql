USE wonderworld;
SET NAMES utf8mb4;

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS food_order_items;
DROP TABLE IF EXISTS food_orders;
DROP TABLE IF EXISTS booking_discounts;
DROP TABLE IF EXISTS parking_bookings;
DROP TABLE IF EXISTS passes;
DROP TABLE IF EXISTS pass_plans;
DROP TABLE IF EXISTS promo_codes;
DROP TABLE IF EXISTS reviews;
DROP TABLE IF EXISTS shifts;
DROP TABLE IF EXISTS lost_items;
DROP TABLE IF EXISTS audit_log;
DROP TABLE IF EXISTS settings;
SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE IF NOT EXISTS support_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NULL,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(15) NOT NULL,
  email VARCHAR(120),
  topic VARCHAR(50),
  message VARCHAR(500),
  preferred_time VARCHAR(30),
  status ENUM('Open','In Progress','Resolved') NOT NULL DEFAULT 'Open',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) DEFAULT CHARSET = utf8mb4;

CREATE TABLE settings (
  name VARCHAR(40) PRIMARY KEY,
  value INT NOT NULL,
  label VARCHAR(100) NOT NULL,
  CONSTRAINT chk_setting_value CHECK (value >= 0)
) DEFAULT CHARSET = utf8mb4;

CREATE TABLE audit_log (
  id INT AUTO_INCREMENT PRIMARY KEY,
  table_name VARCHAR(40) NOT NULL,
  record_id INT NOT NULL,
  action VARCHAR(30) NOT NULL,
  details VARCHAR(255),
  changed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_audit_time (changed_at)
) DEFAULT CHARSET = utf8mb4;

CREATE TABLE promo_codes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(20) NOT NULL UNIQUE,
  description VARCHAR(150),
  discount_type ENUM('Percent','Flat') NOT NULL,
  discount_value INT NOT NULL,
  min_amount INT NOT NULL DEFAULT 0,
  valid_from DATE NOT NULL,
  valid_to DATE NOT NULL,
  usage_limit INT NOT NULL DEFAULT 100,
  used_count INT NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  CONSTRAINT chk_promo_value CHECK (discount_value > 0),
  CONSTRAINT chk_promo_percent CHECK (discount_type <> 'Percent' OR discount_value <= 90),
  CONSTRAINT chk_promo_dates CHECK (valid_to >= valid_from),
  CONSTRAINT chk_promo_limit CHECK (usage_limit > 0)
) DEFAULT CHARSET = utf8mb4;

CREATE TABLE pass_plans (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(40) NOT NULL UNIQUE,
  price INT NOT NULL,
  discount_pct INT NOT NULL,
  validity_days INT NOT NULL DEFAULT 365,
  free_parking BOOLEAN NOT NULL DEFAULT FALSE,
  perks VARCHAR(255),
  active BOOLEAN NOT NULL DEFAULT TRUE,
  CONSTRAINT chk_plan_price CHECK (price > 0),
  CONSTRAINT chk_plan_discount CHECK (discount_pct BETWEEN 0 AND 50),
  CONSTRAINT chk_plan_days CHECK (validity_days > 0)
) DEFAULT CHARSET = utf8mb4;

CREATE TABLE passes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  pass_code VARCHAR(12) NOT NULL UNIQUE,
  user_id INT NOT NULL,
  plan_id INT NOT NULL,
  price INT NOT NULL,
  valid_from DATE NOT NULL,
  valid_to DATE NOT NULL,
  status ENUM('Active','Cancelled') NOT NULL DEFAULT 'Active',
  payment_id VARCHAR(50),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_pass_dates CHECK (valid_to >= valid_from),
  INDEX idx_pass_user (user_id, status, valid_to),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (plan_id) REFERENCES pass_plans(id)
) DEFAULT CHARSET = utf8mb4;

CREATE TABLE booking_discounts (
  booking_id INT PRIMARY KEY,
  subtotal INT NOT NULL,
  pass_id INT NULL,
  pass_discount INT NOT NULL DEFAULT 0,
  promo_id INT NULL,
  promo_discount INT NOT NULL DEFAULT 0,
  CONSTRAINT chk_discount_amounts CHECK (pass_discount >= 0 AND promo_discount >= 0),
  FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
  FOREIGN KEY (pass_id) REFERENCES passes(id) ON DELETE SET NULL,
  FOREIGN KEY (promo_id) REFERENCES promo_codes(id) ON DELETE SET NULL
) DEFAULT CHARSET = utf8mb4;

CREATE TABLE parking_bookings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  parking_code VARCHAR(12) NOT NULL UNIQUE,
  booking_id INT NOT NULL,
  vehicle_type ENUM('Car','Bike') NOT NULL,
  vehicle_no VARCHAR(15) NOT NULL,
  fee INT NOT NULL,
  status ENUM('Booked','Cancelled') NOT NULL DEFAULT 'Booked',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (booking_id, vehicle_no),
  CONSTRAINT chk_parking_fee CHECK (fee >= 0),
  FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
) DEFAULT CHARSET = utf8mb4;

CREATE TABLE reviews (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  ride_id INT NOT NULL,
  rating TINYINT NOT NULL,
  comment VARCHAR(300),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (user_id, ride_id),
  CONSTRAINT chk_review_rating CHECK (rating BETWEEN 1 AND 5),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (ride_id) REFERENCES rides(id) ON DELETE CASCADE
) DEFAULT CHARSET = utf8mb4;

CREATE TABLE food_orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_code VARCHAR(12) NOT NULL UNIQUE,
  user_id INT NOT NULL,
  restaurant_id INT NOT NULL,
  total INT NOT NULL,
  status ENUM('Placed','Preparing','Ready','Collected','Cancelled') NOT NULL DEFAULT 'Placed',
  note VARCHAR(150),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_order_total CHECK (total > 0),
  INDEX idx_food_orders_time (created_at),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (restaurant_id) REFERENCES restaurants(id)
) DEFAULT CHARSET = utf8mb4;

CREATE TABLE food_order_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  menu_item_id INT NULL,
  name VARCHAR(100) NOT NULL,
  price INT NOT NULL,
  qty INT NOT NULL,
  CONSTRAINT chk_order_qty CHECK (qty BETWEEN 1 AND 20),
  FOREIGN KEY (order_id) REFERENCES food_orders(id) ON DELETE CASCADE,
  FOREIGN KEY (menu_item_id) REFERENCES menu_items(id) ON DELETE SET NULL
) DEFAULT CHARSET = utf8mb4;

CREATE TABLE shifts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  employee_id INT NOT NULL,
  ride_id INT NULL,
  shift_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  attendance ENUM('Scheduled','Present','Absent','Leave') NOT NULL DEFAULT 'Scheduled',
  CONSTRAINT chk_shift_time CHECK (end_time > start_time),
  INDEX idx_shift_date (shift_date),
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
  FOREIGN KEY (ride_id) REFERENCES rides(id) ON DELETE SET NULL
) DEFAULT CHARSET = utf8mb4;

CREATE TABLE lost_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NULL,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(15) NOT NULL,
  item VARCHAR(80) NOT NULL,
  description VARCHAR(300),
  lost_date DATE NOT NULL,
  location VARCHAR(100),
  status ENUM('Reported','Found','Returned','Closed') NOT NULL DEFAULT 'Reported',
  admin_note VARCHAR(200),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) DEFAULT CHARSET = utf8mb4;

DROP PROCEDURE IF EXISTS ww_add_indexes;
DELIMITER $$
CREATE PROCEDURE ww_add_indexes()
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'bookings' AND index_name = 'idx_bookings_visit') THEN
    CREATE INDEX idx_bookings_visit ON bookings (visit_date, status);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'bookings' AND index_name = 'idx_bookings_created') THEN
    CREATE INDEX idx_bookings_created ON bookings (created_at);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'ride_logs' AND index_name = 'idx_ride_logs_date') THEN
    CREATE INDEX idx_ride_logs_date ON ride_logs (ride_date);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'rides' AND index_name = 'idx_rides_category') THEN
    CREATE INDEX idx_rides_category ON rides (category, status);
  END IF;
END$$
DELIMITER ;
CALL ww_add_indexes();
DROP PROCEDURE ww_add_indexes;

DROP FUNCTION IF EXISTS fn_setting;
DROP FUNCTION IF EXISTS fn_guests_on;
DROP FUNCTION IF EXISTS fn_spots_left;
DROP FUNCTION IF EXISTS fn_parking_left;

DELIMITER $$
CREATE FUNCTION fn_setting(p_name VARCHAR(40)) RETURNS INT
READS SQL DATA
BEGIN
  RETURN (SELECT value FROM settings WHERE name = p_name);
END$$

CREATE FUNCTION fn_guests_on(p_date DATE) RETURNS INT
READS SQL DATA
BEGIN
  RETURN (
    SELECT COALESCE(SUM(bi.qty), 0)
    FROM bookings b
    JOIN booking_items bi ON bi.booking_id = b.id
    WHERE b.visit_date = p_date AND b.status = 'Confirmed'
  );
END$$

CREATE FUNCTION fn_spots_left(p_date DATE) RETURNS INT
READS SQL DATA
BEGIN
  RETURN fn_setting('daily_capacity') - fn_guests_on(p_date);
END$$

CREATE FUNCTION fn_parking_left(p_date DATE, p_type VARCHAR(4)) RETURNS INT
READS SQL DATA
BEGIN
  RETURN fn_setting(IF(p_type = 'Car', 'car_slots', 'bike_slots')) - (
    SELECT COUNT(*)
    FROM parking_bookings pk
    JOIN bookings b ON b.id = pk.booking_id
    WHERE b.visit_date = p_date AND pk.vehicle_type = p_type AND pk.status = 'Booked'
  );
END$$
DELIMITER ;

DROP VIEW IF EXISTS v_daily_revenue;
DROP VIEW IF EXISTS v_daily_visitors;
DROP VIEW IF EXISTS v_ride_stats;
DROP VIEW IF EXISTS v_booking_details;
DROP VIEW IF EXISTS v_food_sales;
DROP VIEW IF EXISTS v_staff_schedule;
DROP VIEW IF EXISTS v_pass_status;

CREATE VIEW v_daily_revenue AS
SELECT b.created_at AS day,
       COUNT(*) AS bookings,
       SUM(b.total) AS revenue,
       COALESCE(SUM(d.pass_discount + d.promo_discount), 0) AS discounts
FROM bookings b
LEFT JOIN booking_discounts d ON d.booking_id = b.id
WHERE b.status = 'Confirmed'
GROUP BY b.created_at;

CREATE VIEW v_daily_visitors AS
SELECT b.visit_date,
       SUM(bi.qty) AS guests,
       COUNT(DISTINCT b.id) AS bookings
FROM bookings b
JOIN booking_items bi ON bi.booking_id = b.id
WHERE b.status = 'Confirmed'
GROUP BY b.visit_date;

CREATE VIEW v_ride_stats AS
SELECT r.id, r.name, r.category, r.status,
       COALESCE(l.times_ridden, 0) AS times_ridden,
       COALESCE(v.avg_rating, 0) AS avg_rating,
       COALESCE(v.reviews, 0) AS reviews
FROM rides r
LEFT JOIN (SELECT ride_id, COUNT(*) AS times_ridden FROM ride_logs GROUP BY ride_id) l ON l.ride_id = r.id
LEFT JOIN (SELECT ride_id, ROUND(AVG(rating), 1) AS avg_rating, COUNT(*) AS reviews FROM reviews GROUP BY ride_id) v ON v.ride_id = r.id;

CREATE VIEW v_booking_details AS
SELECT b.id, b.booking_code, u.name AS visitor, u.email, b.visit_date, b.created_at,
       (SELECT SUM(qty) FROM booking_items bi WHERE bi.booking_id = b.id) AS guests,
       COALESCE(d.subtotal, b.total) AS subtotal,
       COALESCE(d.pass_discount + d.promo_discount, 0) AS discount,
       p.code AS promo_code,
       b.total, b.status
FROM bookings b
JOIN users u ON u.id = b.user_id
LEFT JOIN booking_discounts d ON d.booking_id = b.id
LEFT JOIN promo_codes p ON p.id = d.promo_id;

CREATE VIEW v_food_sales AS
SELECT r.id AS restaurant_id, r.name AS restaurant,
       COUNT(DISTINCT o.id) AS orders,
       COALESCE(SUM(oi.qty), 0) AS items_sold,
       COALESCE(SUM(oi.qty * oi.price), 0) AS revenue
FROM restaurants r
LEFT JOIN food_orders o ON o.restaurant_id = r.id AND o.status <> 'Cancelled'
LEFT JOIN food_order_items oi ON oi.order_id = o.id
GROUP BY r.id, r.name;

CREATE VIEW v_staff_schedule AS
SELECT s.id, s.shift_date, e.name AS employee, e.role,
       s.start_time, s.end_time,
       ROUND(TIME_TO_SEC(TIMEDIFF(s.end_time, s.start_time)) / 3600, 1) AS hours,
       r.name AS ride, s.attendance
FROM shifts s
JOIN employees e ON e.id = s.employee_id
LEFT JOIN rides r ON r.id = s.ride_id;

CREATE VIEW v_pass_status AS
SELECT p.id, p.pass_code, u.name AS member, u.email, pl.name AS plan, pl.discount_pct,
       p.price, p.valid_from, p.valid_to,
       CASE
         WHEN p.status = 'Cancelled' THEN 'Cancelled'
         WHEN CURDATE() > p.valid_to THEN 'Expired'
         ELSE 'Active'
       END AS current_status
FROM passes p
JOIN users u ON u.id = p.user_id
JOIN pass_plans pl ON pl.id = p.plan_id;

DROP PROCEDURE IF EXISTS sp_revenue_report;
DROP PROCEDURE IF EXISTS sp_occupancy;
DROP PROCEDURE IF EXISTS sp_top_rides;
DROP PROCEDURE IF EXISTS sp_visitor_history;
DROP PROCEDURE IF EXISTS sp_income_summary;

DELIMITER $$
CREATE PROCEDURE sp_revenue_report(IN p_from DATE, IN p_to DATE)
BEGIN
  SELECT day, bookings, revenue, discounts
  FROM v_daily_revenue
  WHERE day BETWEEN p_from AND p_to
  ORDER BY day;
END$$

CREATE PROCEDURE sp_occupancy(IN p_start DATE, IN p_days INT)
BEGIN
  WITH RECURSIVE d AS (
    SELECT p_start AS day
    UNION ALL
    SELECT day + INTERVAL 1 DAY FROM d WHERE day < p_start + INTERVAL (p_days - 1) DAY
  )
  SELECT d.day,
         fn_guests_on(d.day) AS guests,
         fn_setting('daily_capacity') AS capacity,
         fn_spots_left(d.day) AS spots_left,
         ROUND(fn_guests_on(d.day) * 100 / fn_setting('daily_capacity'), 1) AS percent_full,
         fn_setting('car_slots') - fn_parking_left(d.day, 'Car') AS cars_parked,
         fn_setting('bike_slots') - fn_parking_left(d.day, 'Bike') AS bikes_parked
  FROM d;
END$$

CREATE PROCEDURE sp_top_rides(IN p_limit INT)
BEGIN
  SELECT name, category, times_ridden, avg_rating, reviews
  FROM v_ride_stats
  ORDER BY times_ridden DESC, avg_rating DESC
  LIMIT p_limit;
END$$

CREATE PROCEDURE sp_visitor_history(IN p_email VARCHAR(120))
BEGIN
  DECLARE v_user INT;
  SELECT id INTO v_user FROM users WHERE email = p_email;
  IF v_user IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'No visitor with this email';
  END IF;
  SELECT 'Ticket booking' AS activity, booking_code AS reference, visit_date AS on_date, total AS amount, status FROM bookings WHERE user_id = v_user
  UNION ALL
  SELECT 'Food order', order_code, DATE(created_at), total, status FROM food_orders WHERE user_id = v_user
  UNION ALL
  SELECT 'Annual pass', pass_code, valid_from, price, status FROM passes WHERE user_id = v_user
  UNION ALL
  SELECT 'Ride review', r.name, DATE(rv.created_at), rv.rating, 'Posted' FROM reviews rv JOIN rides r ON r.id = rv.ride_id WHERE rv.user_id = v_user
  ORDER BY on_date DESC;
END$$

CREATE PROCEDURE sp_income_summary(IN p_from DATE, IN p_to DATE)
BEGIN
  SELECT 'Tickets' AS source, COUNT(*) AS sales, COALESCE(SUM(total), 0) AS income
  FROM bookings WHERE status = 'Confirmed' AND created_at BETWEEN p_from AND p_to
  UNION ALL
  SELECT 'Food', COUNT(*), COALESCE(SUM(total), 0)
  FROM food_orders WHERE status <> 'Cancelled' AND DATE(created_at) BETWEEN p_from AND p_to
  UNION ALL
  SELECT 'Annual passes', COUNT(*), COALESCE(SUM(price), 0)
  FROM passes WHERE status = 'Active' AND DATE(created_at) BETWEEN p_from AND p_to
  UNION ALL
  SELECT 'Parking', COUNT(*), COALESCE(SUM(pk.fee), 0)
  FROM parking_bookings pk WHERE pk.status = 'Booked' AND DATE(pk.created_at) BETWEEN p_from AND p_to;
END$$
DELIMITER ;

DROP TRIGGER IF EXISTS trg_booking_items_capacity;
DROP TRIGGER IF EXISTS trg_bookings_after_insert;
DROP TRIGGER IF EXISTS trg_bookings_after_update;
DROP TRIGGER IF EXISTS trg_discount_before_insert;
DROP TRIGGER IF EXISTS trg_discount_after_insert;
DROP TRIGGER IF EXISTS trg_parking_before_insert;
DROP TRIGGER IF EXISTS trg_shift_before_insert;
DROP TRIGGER IF EXISTS trg_shift_before_update;
DROP TRIGGER IF EXISTS trg_pass_before_insert;
DROP TRIGGER IF EXISTS trg_pass_after_insert;
DROP TRIGGER IF EXISTS trg_review_before_insert;
DROP TRIGGER IF EXISTS trg_food_order_after_insert;
DROP TRIGGER IF EXISTS trg_food_order_after_update;

DELIMITER $$
CREATE TRIGGER trg_booking_items_capacity
BEFORE INSERT ON booking_items
FOR EACH ROW
BEGIN
  DECLARE v_date DATE;
  DECLARE v_status VARCHAR(20);
  SELECT visit_date, status INTO v_date, v_status FROM bookings WHERE id = NEW.booking_id;
  IF v_status = 'Confirmed' AND fn_guests_on(v_date) + NEW.qty > fn_setting('daily_capacity') THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'The park is full on this date. Please choose another day.';
  END IF;
END$$

CREATE TRIGGER trg_bookings_after_insert
AFTER INSERT ON bookings
FOR EACH ROW
BEGIN
  INSERT INTO audit_log (table_name, record_id, action, details)
  VALUES ('bookings', NEW.id, 'INSERT', CONCAT('Booking ', NEW.booking_code, ' for ', NEW.visit_date, ', total Rs ', NEW.total));
END$$

CREATE TRIGGER trg_bookings_after_update
AFTER UPDATE ON bookings
FOR EACH ROW
BEGIN
  IF OLD.status <> NEW.status THEN
    INSERT INTO audit_log (table_name, record_id, action, details)
    VALUES ('bookings', NEW.id, 'STATUS', CONCAT('Booking ', NEW.booking_code, ': ', OLD.status, ' -> ', NEW.status));
    IF NEW.status = 'Cancelled' THEN
      UPDATE parking_bookings SET status = 'Cancelled' WHERE booking_id = NEW.id AND status = 'Booked';
    END IF;
  END IF;
END$$

CREATE TRIGGER trg_discount_before_insert
BEFORE INSERT ON booking_discounts
FOR EACH ROW
BEGIN
  DECLARE v_used INT;
  DECLARE v_limit INT;
  IF NEW.promo_id IS NOT NULL THEN
    SELECT used_count, usage_limit INTO v_used, v_limit FROM promo_codes WHERE id = NEW.promo_id;
    IF v_used >= v_limit THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'This promo code has reached its usage limit.';
    END IF;
  END IF;
END$$

CREATE TRIGGER trg_discount_after_insert
AFTER INSERT ON booking_discounts
FOR EACH ROW
BEGIN
  IF NEW.promo_id IS NOT NULL THEN
    UPDATE promo_codes SET used_count = used_count + 1 WHERE id = NEW.promo_id;
  END IF;
END$$

CREATE TRIGGER trg_parking_before_insert
BEFORE INSERT ON parking_bookings
FOR EACH ROW
BEGIN
  DECLARE v_date DATE;
  SELECT visit_date INTO v_date FROM bookings WHERE id = NEW.booking_id;
  IF fn_parking_left(v_date, NEW.vehicle_type) <= 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'No parking slots left for this vehicle type on this date.';
  END IF;
END$$

CREATE TRIGGER trg_shift_before_insert
BEFORE INSERT ON shifts
FOR EACH ROW
BEGIN
  IF EXISTS (
    SELECT 1 FROM shifts
    WHERE employee_id = NEW.employee_id AND shift_date = NEW.shift_date
      AND NEW.start_time < end_time AND NEW.end_time > start_time
  ) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'This employee already has a shift at this time.';
  END IF;
END$$

CREATE TRIGGER trg_shift_before_update
BEFORE UPDATE ON shifts
FOR EACH ROW
BEGIN
  IF EXISTS (
    SELECT 1 FROM shifts
    WHERE id <> NEW.id AND employee_id = NEW.employee_id AND shift_date = NEW.shift_date
      AND NEW.start_time < end_time AND NEW.end_time > start_time
  ) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'This employee already has a shift at this time.';
  END IF;
END$$

CREATE TRIGGER trg_pass_before_insert
BEFORE INSERT ON passes
FOR EACH ROW
BEGIN
  IF EXISTS (
    SELECT 1 FROM passes
    WHERE user_id = NEW.user_id AND status = 'Active' AND valid_to >= NEW.valid_from
  ) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'You already have an active annual pass.';
  END IF;
END$$

CREATE TRIGGER trg_pass_after_insert
AFTER INSERT ON passes
FOR EACH ROW
BEGIN
  INSERT INTO audit_log (table_name, record_id, action, details)
  VALUES ('passes', NEW.id, 'INSERT', CONCAT('Pass ', NEW.pass_code, ' valid till ', NEW.valid_to));
END$$

CREATE TRIGGER trg_review_before_insert
BEFORE INSERT ON reviews
FOR EACH ROW
BEGIN
  IF NOT EXISTS (SELECT 1 FROM ride_logs WHERE user_id = NEW.user_id AND ride_id = NEW.ride_id) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'You can only review rides you have been on.';
  END IF;
END$$

CREATE TRIGGER trg_food_order_after_insert
AFTER INSERT ON food_orders
FOR EACH ROW
BEGIN
  INSERT INTO audit_log (table_name, record_id, action, details)
  VALUES ('food_orders', NEW.id, 'INSERT', CONCAT('Food order ', NEW.order_code, ', total Rs ', NEW.total));
END$$

CREATE TRIGGER trg_food_order_after_update
AFTER UPDATE ON food_orders
FOR EACH ROW
BEGIN
  IF OLD.status <> NEW.status THEN
    INSERT INTO audit_log (table_name, record_id, action, details)
    VALUES ('food_orders', NEW.id, 'STATUS', CONCAT('Food order ', NEW.order_code, ': ', OLD.status, ' -> ', NEW.status));
  END IF;
END$$
DELIMITER ;

INSERT INTO settings (name, value, label) VALUES
('daily_capacity', 500, 'Maximum visitors per day'),
('car_slots', 150, 'Car parking slots per day'),
('bike_slots', 250, 'Bike parking slots per day'),
('car_fee', 200, 'Car parking fee (Rs)'),
('bike_fee', 100, 'Bike parking fee (Rs)');

INSERT INTO promo_codes (code, description, discount_type, discount_value, min_amount, valid_from, valid_to, usage_limit) VALUES
('WELCOME10', '10% off your first visit', 'Percent', 10, 1000, CURDATE() - INTERVAL 30 DAY, CURDATE() + INTERVAL 180 DAY, 500),
('FAMILY500', 'Rs 500 off on bookings above Rs 4,000', 'Flat', 500, 4000, CURDATE() - INTERVAL 30 DAY, CURDATE() + INTERVAL 180 DAY, 200),
('STUDENT20', '20% off for students', 'Percent', 20, 1500, CURDATE() - INTERVAL 10 DAY, CURDATE() + INTERVAL 90 DAY, 100),
('LIMITED2', 'Flash deal: only 2 uses', 'Flat', 300, 0, CURDATE() - INTERVAL 1 DAY, CURDATE() + INTERVAL 30 DAY, 2),
('DIWALI25', 'Festival offer (expired)', 'Percent', 25, 0, CURDATE() - INTERVAL 60 DAY, CURDATE() - INTERVAL 1 DAY, 300);

INSERT INTO pass_plans (name, price, discount_pct, validity_days, free_parking, perks) VALUES
('Silver', 4999, 10, 365, FALSE, '10% off every ticket booking for 1 year'),
('Gold', 7999, 20, 365, TRUE, '20% off every ticket booking, free parking for 1 year'),
('Platinum', 11999, 30, 365, TRUE, '30% off every ticket booking, free parking, priority entry for 1 year');

INSERT INTO shifts (employee_id, ride_id, shift_date, start_time, end_time, attendance)
SELECT e.id, e.ride_id, CURDATE() - INTERVAL 1 DAY, '10:00', '18:00', IF(e.id % 4 = 0, 'Absent', 'Present') FROM employees e;
INSERT INTO shifts (employee_id, ride_id, shift_date, start_time, end_time)
SELECT e.id, e.ride_id, CURDATE(), IF(e.id % 2 = 0, '09:00', '12:00'), IF(e.id % 2 = 0, '17:00', '20:00') FROM employees e;
INSERT INTO shifts (employee_id, ride_id, shift_date, start_time, end_time)
SELECT e.id, e.ride_id, CURDATE() + INTERVAL 1 DAY, '10:00', '18:00' FROM employees e;

INSERT IGNORE INTO reviews (user_id, ride_id, rating, comment)
SELECT x.user_id, x.ride_id,
       3 + (x.user_id + x.ride_id) % 3,
       ELT(1 + (x.user_id * 7 + x.ride_id) % 5,
           'Loved it! Will ride again.',
           'Great fun for the whole family.',
           'Short queue and very well maintained.',
           'Thrilling! My heart is still racing.',
           'Good ride, but the wait was a bit long.')
FROM (SELECT DISTINCT user_id, ride_id FROM ride_logs) x
ORDER BY x.user_id, x.ride_id
LIMIT 40;

INSERT INTO lost_items (name, phone, item, description, lost_date, location, status, admin_note) VALUES
('Rahul Verma', '9812345678', 'Black wallet', 'Leather wallet with college ID inside', CURDATE() - INTERVAL 2 DAY, 'Near Sky Screamer queue', 'Found', 'Kept at Guest Services, bring ID proof'),
('Neha Gupta', '9898989898', 'Blue water bottle', 'Steel bottle with stickers', CURDATE() - INTERVAL 1 DAY, 'Wave Lagoon lockers', 'Reported', NULL),
('Aman Singh', '9765432109', 'Sunglasses', 'Ray-Ban style, black frame', CURDATE() - INTERVAL 5 DAY, 'Food court', 'Returned', 'Handed over to owner');