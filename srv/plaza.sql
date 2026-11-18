USE wonderworld;
SET NAMES utf8mb4;

DROP TABLE IF EXISTS plaza_show_times;
DROP TABLE IF EXISTS plaza_shows;
DROP TABLE IF EXISTS menu_items;
DROP TABLE IF EXISTS restaurants;
DROP TABLE IF EXISTS shops;

CREATE TABLE plaza_shows (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description VARCHAR(300),
  place VARCHAR(100) NOT NULL,
  duration INT NOT NULL,
  days ENUM('Daily','Weekends') NOT NULL DEFAULT 'Daily',
  status ENUM('Running','Cancelled') NOT NULL DEFAULT 'Running',
  img VARCHAR(500),
  CHECK (duration BETWEEN 5 AND 240)
) DEFAULT CHARSET = utf8mb4;

CREATE TABLE plaza_show_times (
  id INT AUTO_INCREMENT PRIMARY KEY,
  show_id INT NOT NULL,
  show_time TIME NOT NULL,
  UNIQUE (show_id, show_time),
  FOREIGN KEY (show_id) REFERENCES plaza_shows(id) ON DELETE CASCADE
) DEFAULT CHARSET = utf8mb4;

CREATE TABLE restaurants (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  cuisine VARCHAR(150),
  open_time TIME NOT NULL,
  close_time TIME NOT NULL,
  rating DECIMAL(2,1) DEFAULT 4.5,
  img VARCHAR(500),
  CHECK (rating BETWEEN 1 AND 5)
) DEFAULT CHARSET = utf8mb4;

CREATE TABLE menu_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  restaurant_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  price INT NOT NULL,
  veg BOOLEAN NOT NULL DEFAULT TRUE,
  CHECK (price > 0),
  FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE
) DEFAULT CHARSET = utf8mb4;

CREATE TABLE shops (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description VARCHAR(300),
  price_range VARCHAR(50),
  open_time TIME NOT NULL,
  close_time TIME NOT NULL,
  img VARCHAR(500)
) DEFAULT CHARSET = utf8mb4;

INSERT INTO plaza_shows (name, description, place, duration, days, img) VALUES
('Grand WonderWorld Parade', 'Colourful floats, dancers and costumed characters march around the plaza.', 'Plaza main road', 30, 'Daily', 'https://images.unsplash.com/photo-1609051589207-264fb1f91000?auto=format&fit=crop&w=900&q=80'),
('Live Band @ Plaza', 'Bollywood hits and popular songs played live. Sing and dance along!', 'Plaza bandstand', 45, 'Daily', 'https://images.unsplash.com/photo-1623546835805-ba3d0f9fb7c5?auto=format&fit=crop&w=900&q=80'),
('Carnival Street Performers', 'Jugglers, stilt walkers and magicians perform right next to you.', 'Around the food court', 20, 'Daily', 'https://images.unsplash.com/photo-1784891743588-51e8ac5e8380?auto=format&fit=crop&w=900&q=80'),
('Night Lights Finale', 'The whole park lights up with music and colourful lights to end your day.', 'Near the Sky Wheel', 15, 'Weekends', 'https://images.unsplash.com/photo-1688582952217-e8617c8a5109?auto=format&fit=crop&w=900&q=80');

INSERT INTO plaza_show_times (show_id, show_time) VALUES
(1, '13:00'), (1, '17:30'),
(2, '12:00'), (2, '15:00'), (2, '18:30'),
(3, '11:30'), (3, '14:30'), (3, '16:30'),
(4, '19:30');

INSERT INTO restaurants (name, cuisine, open_time, close_time, rating, img) VALUES
('Royal Thali House', 'North Indian · Thali · Pure Veg', '11:00', '19:00', 4.6, 'https://images.unsplash.com/photo-1742281257687-092746ad6021?auto=format&fit=crop&w=900&q=80'),
('Burger Junction', 'Burgers · Fries · Shakes', '10:30', '20:00', 4.4, 'https://images.unsplash.com/photo-1561758033-d89a9ad46330?auto=format&fit=crop&w=900&q=80'),
('Mumbai Street Bites', 'Chaat · Pav Bhaji · Snacks', '10:30', '20:00', 4.5, 'https://images.unsplash.com/photo-1589778655375-3e622a9fc91c?auto=format&fit=crop&w=900&q=80'),
('Scoops & Swirls', 'Ice Cream · Desserts · Cold Drinks', '10:30', '20:00', 4.7, 'https://images.unsplash.com/photo-1629385697093-57be2cc97fa6?auto=format&fit=crop&w=900&q=80');

INSERT INTO menu_items (restaurant_id, name, price, veg) VALUES
(1, 'Deluxe Veg Thali', 349, TRUE), (1, 'Jain Thali', 329, TRUE), (1, 'Mini Thali', 249, TRUE), (1, 'Paneer Butter Masala with Naan', 279, TRUE),
(1, 'Dal Makhani with Jeera Rice', 229, TRUE), (1, 'Chole Bhature', 199, TRUE), (1, 'Rajma Chawal', 189, TRUE), (1, 'Veg Biryani with Raita', 249, TRUE),
(1, 'Dal Khichdi', 199, TRUE), (1, 'Gulab Jamun (2 pcs)', 89, TRUE), (1, 'Masala Chaas', 79, TRUE), (1, 'Sweet Lassi', 99, TRUE),
(2, 'Classic Veg Burger', 179, TRUE), (2, 'Paneer Tikka Burger', 209, TRUE), (2, 'Crispy Chicken Burger', 229, FALSE), (2, 'Double Chicken Burger', 299, FALSE),
(2, 'Peri Peri Fries', 129, TRUE), (2, 'Cheese Loaded Fries', 169, TRUE), (2, 'Cheese Pizza Slice', 149, TRUE), (2, 'Chicken Pepperoni Slice', 189, FALSE),
(2, 'Chicken Nuggets (6 pcs)', 199, FALSE), (2, 'Veg Wrap', 159, TRUE), (2, 'Chocolate Shake', 159, TRUE), (2, 'Cold Drink', 79, TRUE),
(3, 'Pav Bhaji', 159, TRUE), (3, 'Vada Pav', 69, TRUE), (3, 'Misal Pav', 139, TRUE), (3, 'Pani Puri', 89, TRUE),
(3, 'Sev Puri', 99, TRUE), (3, 'Dahi Puri', 109, TRUE), (3, 'Bhel Puri', 89, TRUE), (3, 'Masala Corn Cup', 99, TRUE),
(3, 'Veg Frankie', 139, TRUE), (3, 'Chicken Frankie', 169, FALSE), (3, 'Egg Bhurji Pav', 129, FALSE), (3, 'Cutting Chai', 39, TRUE),
(4, 'Single Scoop Cone', 99, TRUE), (4, 'Double Scoop Cone', 159, TRUE), (4, 'Double Scoop Sundae', 189, TRUE), (4, 'Hot Chocolate Fudge', 199, TRUE),
(4, 'Brownie with Ice Cream', 199, TRUE), (4, 'Mango Kulfi', 79, TRUE), (4, 'Rabri Kulfi', 99, TRUE), (4, 'Belgian Waffle', 179, TRUE),
(4, 'Chocolate Pastry', 129, TRUE), (4, 'Cold Coffee', 139, TRUE), (4, 'Mango Shake', 129, TRUE), (4, 'Fresh Lime Soda', 79, TRUE);

INSERT INTO shops (name, description, price_range, open_time, close_time, img) VALUES
('WonderWorld Souvenirs', 'Caps, T-shirts, mugs, keychains and fridge magnets to remember your day.', '₹99 – ₹1,499', '10:00', '20:00', 'https://images.unsplash.com/photo-1689527612745-a90ea8805008?auto=format&fit=crop&w=900&q=80'),
('Toy Town', 'Soft toys, ride models, water guns and party balloons for kids.', '₹149 – ₹2,499', '10:00', '20:00', 'https://images.unsplash.com/photo-1715889868942-b6df178c60b3?auto=format&fit=crop&w=900&q=80'),
('Ride Photo Studio', 'Collect your on-ride photos and print them in a souvenir frame.', '₹199 – ₹699', '10:30', '20:00', 'https://images.unsplash.com/photo-1759323321196-2813db509285?auto=format&fit=crop&w=900&q=80');