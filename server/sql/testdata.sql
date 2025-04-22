-- Test data for cs_department
INSERT INTO cs_department (department_name, department_description, department_is_active) VALUES
('Sales', 'Handles all sales-related activities and customer acquisition', TRUE),
('Marketing', 'Manages brand awareness and promotional campaigns', TRUE),
('Customer Service', 'Handles customer inquiries and support', TRUE),
('Human Resources', 'Manages employee relations and recruitment', TRUE),
('Finance', 'Handles accounting and financial operations', TRUE),
('IT', 'Manages technical infrastructure and software development', TRUE),
('Operations', 'Oversees day-to-day business operations', TRUE),
('R&D', 'Focuses on product research and development', TRUE),
('Administration', 'Handles administrative tasks and office management', FALSE);

-- Test data for cs_positions
INSERT INTO cs_positions (position_name, position_description, position_is_active, default_commission_percentage, department_id) VALUES
('Sales Representative', 'Front-line sales staff responsible for direct customer sales', TRUE, 5.00, 1),
('Senior Sales Representative', 'Experienced sales staff handling key accounts', TRUE, 7.50, 1),
('Sales Manager', 'Oversees sales team operations and performance', TRUE, 10.00, 1),
('Marketing Coordinator', 'Assists in executing marketing campaigns', TRUE, 0.00, 2),
('Marketing Specialist', 'Develops and manages specific marketing initiatives', TRUE, 2.00, 2),
('Customer Support Agent', 'Provides direct support to customers', TRUE, 1.00, 3),
('HR Specialist', 'Handles specific human resource functions', TRUE, 0.00, 4),
('Financial Analyst', 'Analyzes financial data and prepares reports', TRUE, 0.00, 5),
('Software Developer', 'Designs and develops software applications', TRUE, 0.00, 6),
('Operations Coordinator', 'Assists in managing daily operations', TRUE, 0.00, 7),
('Research Scientist', 'Conducts research for new product development', TRUE, 3.00, 8),
('Administrative Assistant', 'Provides administrative support', FALSE, 0.00, 9),
('Sales Director', 'Oversees entire sales division', TRUE, 15.00, 1);