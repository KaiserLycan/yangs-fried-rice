insert into categories (category_name) values
  ('Fried Rice'),
  ('Noodles'),
  ('Drinks');

insert into product (category_id, product_name, product_price, is_available, product_details)
select category_id, 'Yang Special Fried Rice', 185.00, true, 'House special with egg, char siu, and scallions'
from categories where category_name = 'Fried Rice'
union all
select category_id, 'Vegetable Fried Rice', 145.00, true, 'Mixed seasonal vegetables'
from categories where category_name = 'Fried Rice'
union all
select category_id, 'Beef Chow Fun', 195.00, true, 'Wide rice noodles, beef, bean sprouts'
from categories where category_name = 'Noodles'
union all
select category_id, 'Iced Milk Tea', 65.00, true, null
from categories where category_name = 'Drinks';