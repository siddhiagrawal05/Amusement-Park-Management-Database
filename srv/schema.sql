-- WonderWorld database: tables + starting data
DROP DATABASE IF EXISTS wonderworld;
CREATE DATABASE wonderworld;
USE wonderworld;

-- Module 1: visitors and admins (role keeps them separate)
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(120) NOT NULL UNIQUE,
  phone VARCHAR(15) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('visitor','admin') NOT NULL DEFAULT 'visitor',
  joined DATE NOT NULL
);

-- Module 2: ticket types and bookings
CREATE TABLE ticket_types (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  price INT NOT NULL,
  description VARCHAR(200),
  img VARCHAR(500)
);

-- Module 3: rides
CREATE TABLE rides (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  category ENUM('Thrill','Family','Kids','Water') NOT NULL,
  img VARCHAR(500),
  status ENUM('Open','Closed','Under Maintenance') NOT NULL DEFAULT 'Open',
  capacity INT NOT NULL,
  min_height INT NOT NULL DEFAULT 0,
  min_age INT NOT NULL DEFAULT 0,
  duration INT NOT NULL DEFAULT 1,
  rules VARCHAR(200),
  description VARCHAR(300)
);

CREATE TABLE bookings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  booking_code VARCHAR(12) NOT NULL UNIQUE,
  user_id INT NOT NULL,
  visit_date DATE NOT NULL,
  total INT NOT NULL,
  status ENUM('Confirmed','Cancelled') NOT NULL DEFAULT 'Confirmed',
  created_at DATE NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE booking_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  booking_id INT NOT NULL,
  ticket_type_id INT NOT NULL,
  name VARCHAR(50) NOT NULL,
  price INT NOT NULL,
  qty INT NOT NULL,
  FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
  FOREIGN KEY (ticket_type_id) REFERENCES ticket_types(id)
);

-- Module 3: which visitor used which ride
CREATE TABLE ride_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  ride_id INT NOT NULL,
  ride_date DATE NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (ride_id) REFERENCES rides(id) ON DELETE CASCADE
);

-- Module 4: schedules and maintenance
CREATE TABLE schedules (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ride_id INT NOT NULL,
  days VARCHAR(20) NOT NULL,
  open_time TIME NOT NULL,
  close_time TIME NOT NULL,
  FOREIGN KEY (ride_id) REFERENCES rides(id) ON DELETE CASCADE
);

CREATE TABLE maintenance (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ride_id INT NOT NULL,
  maint_date DATE NOT NULL,
  description VARCHAR(255) NOT NULL,
  status ENUM('Scheduled','In Progress','Completed') NOT NULL DEFAULT 'Scheduled',
  FOREIGN KEY (ride_id) REFERENCES rides(id) ON DELETE CASCADE
);

-- Module 5: employees
CREATE TABLE employees (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  role VARCHAR(50) NOT NULL,
  phone VARCHAR(15) NOT NULL,
  email VARCHAR(120) NOT NULL,
  ride_id INT NULL,
  FOREIGN KEY (ride_id) REFERENCES rides(id) ON DELETE SET NULL
);

-- ---------- Starting data ----------
INSERT INTO ticket_types (name, price, description, img) VALUES
('Child', 899, 'Age 3 to 12 years', 'https://images.unsplash.com/photo-1542332606-b2d1c52a6c33?auto=format&fit=crop&w=800&q=80'),
('Adult', 1499, 'Age 13 to 59 years', 'https://images.unsplash.com/photo-1704925052388-070244d29a3a?auto=format&fit=crop&w=800&q=80'),
('Senior', 999, 'Age 60 years and above', 'https://images.unsplash.com/photo-1584049382558-d7332851effd?auto=format&fit=crop&w=800&q=80'),
('VIP Express', 2999, 'Skip queues + free lunch', 'https://images.unsplash.com/photo-1578937228099-a6fe1dd01b59?auto=format&fit=crop&w=800&q=80');

INSERT INTO rides (name, category, img, status, capacity, min_height, min_age, duration, rules, description) VALUES
('Thunder Coaster', 'Thrill', 'https://images.unsplash.com/photo-1567609894562-d00168e290f6?auto=format&fit=crop&w=900&q=80', 'Open', 24, 140, 12, 3, 'Not for heart patients or pregnant women', 'Loops, drops and 100 km/h of pure speed.'),
('Loop Fury', 'Thrill', 'https://images.unsplash.com/photo-1759179125042-98534a3d47bf?auto=format&fit=crop&w=900&q=80', 'Closed', 20, 135, 12, 2, 'Loose items must be kept in lockers', 'Three upside-down loops in under a minute.'),
('Space Drop', 'Thrill', 'https://images.unsplash.com/photo-1751896077567-c5529b9173f9?auto=format&fit=crop&w=900&q=80', 'Open', 12, 145, 14, 2, 'Maximum weight 110 kg', 'Free-fall 80 metres in 3 seconds.'),
('Sky Wheel', 'Family', 'https://images.unsplash.com/photo-1464059728276-d877187d61a9?auto=format&fit=crop&w=900&q=80', 'Open', 48, 0, 0, 12, 'Children below 8 must ride with an adult', 'See the whole park from 60 metres up.'),
('Dino Safari', 'Family', 'https://images.unsplash.com/photo-1633876204719-dd74580764ea?auto=format&fit=crop&w=900&q=80', 'Open', 40, 100, 4, 8, 'Keep hands inside the vehicle', 'Drive through a jungle full of dinosaurs.'),
('Royal Carousel', 'Kids', 'https://images.unsplash.com/photo-1577774438656-768f1e5d9ed6?auto=format&fit=crop&w=900&q=80', 'Open', 30, 0, 2, 4, 'Kids below 6 must ride with an adult', 'A classic merry-go-round with magical horses.'),
('Wave Swinger', 'Kids', 'https://images.unsplash.com/photo-1601930113377-729966035f34?auto=format&fit=crop&w=900&q=80', 'Open', 32, 110, 6, 4, 'Hold on to the chains at all times', 'Fly round and round on high swings.'),
('Splash Rapids', 'Water', 'https://images.unsplash.com/photo-1707575878561-794d400bbb1e?auto=format&fit=crop&w=900&q=80', 'Under Maintenance', 16, 120, 8, 5, 'You will get wet!', 'Raft through wild rapids and big splashes.'),
('Aqua Twister', 'Water', 'https://images.unsplash.com/photo-1703167906241-03f513c604fb?auto=format&fit=crop&w=900&q=80', 'Open', 10, 120, 8, 2, 'Swimwear required', 'A giant twisting slide into the wave pool.');

INSERT INTO schedules (ride_id, days, open_time, close_time)
SELECT id, 'Mon - Fri', '10:30', '18:00' FROM rides
UNION ALL
SELECT id, 'Sat - Sun', '10:00', '20:00' FROM rides;

INSERT INTO maintenance (ride_id, maint_date, description, status) VALUES
(8, CURDATE(), 'Water pump replacement', 'In Progress'),
(1, DATE_SUB(CURDATE(), INTERVAL 20 DAY), 'Track bolt inspection', 'Completed'),
(3, DATE_ADD(CURDATE(), INTERVAL 7 DAY), 'Brake system safety audit', 'Scheduled');

INSERT INTO employees (name, role, phone, email, ride_id) VALUES
('Rahul Verma', 'Ride Operator', '9844444444', 'rahul@ww.com', 1),
('Priya Nair', 'Technician', '9855555555', 'priya@ww.com', 8),
('Imran Shaikh', 'Ride Operator', '9866666666', 'imran@ww.com', 5),
('Neha Joshi', 'Ticket Counter', '9877777777', 'neha@ww.com', NULL),
('Vikram Singh', 'Security', '9888888888', 'vikram@ww.com', NULL);