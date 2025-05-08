use FINAL_PROJECT_OOSE;
-- -- Insert sample data

-- Insert default roles
INSERT INTO Role (roleName) VALUES
('administrator'), -- roleId 1
('doctor'),      -- roleId 2
('patient'),     -- roleId 3
('lab_technician'); -- roleId 4

-- All users have the same password: "password"
-- The password is stored as a bcrypt hash: $2a$12$ZYlEJnSQDFI4qy/s9jYo6O9vKqKOQCULgUpKS1vt5/FrA.iCVEsvy
-- Insert sample data into User table (ensure user IDs are generated first)
INSERT INTO User (email, password, fullName, gender, dob, phoneNumber, address, accountStatus, roleId) VALUES
-- Administrators (roleId = 1)
('admin@hospital.com', '$2y$10$96uOlG86tdM2R.NL7gsG.upbyeBcM6T8IMUc9B1KhwBKymPYUQD/G', 'Admin User', 'male', '1975-05-10', '0901234567', '123 Admin St', 'active', 1), -- userId 1
('manager@hospital.com', '$2y$10$96uOlG86tdM2R.NL7gsG.upbyeBcM6T8IMUc9B1KhwBKymPYUQD/G', 'Manager User', 'female', '1980-11-22', '0901234568', '124 Admin St', 'active', 1), -- userId 2

-- Doctors (roleId = 2)
('drsmith@hospital.com', '$2y$10$96uOlG86tdM2R.NL7gsG.upbyeBcM6T8IMUc9B1KhwBKymPYUQD/G', 'Dr. John Smith', 'male', '1978-09-15', '0901234569', '125 Doctor St', 'active', 2), -- userId 3 (Doctor 1)
('drnguyen@hospital.com', '$2y$10$96uOlG86tdM2R.NL7gsG.upbyeBcM6T8IMUc9B1KhwBKymPYUQD/G', 'Dr. Nguyen Van A', 'male', '1982-03-20', '0901234570', '126 Doctor St', 'active', 2), -- userId 4 (Doctor 2)
('drpham@hospital.com', '$2y$10$96uOlG86tdM2R.NL7gsG.upbyeBcM6T8IMUc9B1KhwBKymPYUQD/G', 'Dr. Pham Thi B', 'female', '1985-07-01', '0901234571', '127 Doctor St', 'active', 2), -- userId 5 (Doctor 3)
('drle@hospital.com', '$2y$10$96uOlG86tdM2R.NL7gsG.upbyeBcM6T8IMUc9B1KhwBKymPYUQD/G', 'Dr. Le Van C', 'male', '1976-12-05', '0901234572', '128 Doctor St', 'active', 2), -- userId 6 (Doctor 4)
('drtran@hospital.com', '$2y$10$96uOlG86tdM2R.NL7gsG.upbyeBcM6T8IMUc9B1KhwBKymPYUQD/G', 'Dr. Tran Thi D', 'female', '1988-02-28', '0901234573', '129 Doctor St', 'active', 2), -- userId 7 (Doctor 5)
('drvo@hospital.com', '$2y$10$96uOlG86tdM2R.NL7gsG.upbyeBcM6T8IMUc9B1KhwBKymPYUQD/G', 'Dr. Vo Van E', 'male', '1980-04-18', '0901234581', '137 Doctor St', 'active', 2), -- userId 8 (Doctor 6)
('drdang@hospital.com', '$2y$10$96uOlG86tdM2R.NL7gsG.upbyeBcM6T8IMUc9B1KhwBKymPYUQD/G', 'Dr. Dang Thi F', 'female', '1983-09-03', '0901234582', '138 Doctor St', 'active', 2), -- userId 9 (Doctor 7)
('drbui@hospital.com', '$2y$10$96uOlG86tdM2R.NL7gsG.upbyeBcM6T8IMUc9B1KhwBKymPYUQD/G', 'Dr. Bui Van G', 'male', '1979-11-11', '0901234583', '139 Doctor St', 'active', 2), -- userId 10 (Doctor 8)
('drhoang@hospital.com', '$2y$10$96uOlG86tdM2R.NL7gsG.upbyeBcM6T8IMUc9B1KhwBKymPYUQD/G', 'Dr. Hoang Thi H', 'female', '1987-06-22', '0901234584', '140 Doctor St', 'active', 2), -- userId 11 (Doctor 9)
('drcao@hospital.com', '$2y$10$96uOlG86tdM2R.NL7gsG.upbyeBcM6T8IMUc9B1KhwBKymPYUQD/G', 'Dr. Cao Van I', 'male', '1981-01-30', '0901234585', '141 Doctor St', 'active', 2), -- userId 12 (Doctor 10)
('drdinh@hospital.com', '$2y$10$96uOlG86tdM2R.NL7gsG.upbyeBcM6T8IMUc9B1KhwBKymPYUQD/G', 'Dr. Dinh Thi K', 'female', '1984-08-05', '0901234586', '142 Doctor St', 'active', 2), -- userId 13 (Doctor 11)
('drtruong@hospital.com', '$2y$10$96uOlG86tdM2R.NL7gsG.upbyeBcM6T8IMUc9B1KhwBKymPYUQD/G', 'Dr. Truong Van L', 'male', '1977-03-17', '0901234587', '143 Doctor St', 'active', 2), -- userId 14 (Doctor 12)
('drvoh@hospital.com', '$2y$10$96uOlG86tdM2R.NL7gsG.upbyeBcM6T8IMUc9B1KhwBKymPYUQD/G', 'Dr. Vo Thi M', 'female', '1986-05-29', '0901234588', '144 Doctor St', 'active', 2), -- userId 15 (Doctor 13)
('drhuynh@hospital.com', '$2y$10$96uOlG86tdM2R.NL7gsG.upbyeBcM6T8IMUc9B1KhwBKymPYUQD/G', 'Dr. Huynh Van N', 'male', '1989-10-14', '0901234589', '145 Doctor St', 'active', 2), -- userId 16 (Doctor 14)
('drphan@hospital.com', '$2y$10$96uOlG86tdM2R.NL7gsG.upbyeBcM6T8IMUc9B1KhwBKymPYUQD/G', 'Dr. Phan Thi O', 'female', '1991-02-23', '0901234590', '146 Doctor St', 'active', 2), -- userId 17 (Doctor 15)
('drdo@hospital.com', '$2y$10$96uOlG86tdM2R.NL7gsG.upbyeBcM6T8IMUc9B1KhwBKymPYUQD/G', 'Dr. Do Van P', 'male', '1983-07-08', '0901234591', '147 Doctor St', 'active', 2), -- userId 18 (Doctor 16)
('drngo@hospital.com', '$2y$10$96uOlG86tdM2R.NL7gsG.upbyeBcM6T8IMUc9B1KhwBKymPYUQD/G', 'Dr. Ngo Thi Q', 'female', '1976-12-01', '0901234592', '148 Doctor St', 'active', 2), -- userId 19 (Doctor 17)
('drduong@hospital.com', '$2y$10$96uOlG86tdM2R.NL7gsG.upbyeBcM6T8IMUc9B1KhwBKymPYUQD/G', 'Dr. Duong Van R', 'male', '1988-04-20', '0901234593', '149 Doctor St', 'active', 2), -- userId 20 (Doctor 18)
('drtu@hospital.com', '$2y$10$96uOlG86tdM2R.NL7gsG.upbyeBcM6T8IMUc9B1KhwBKymPYUQD/G', 'Dr. Tu Thi S', 'female', '1982-09-16', '0901234594', '150 Doctor St', 'active', 2), -- userId 21 (Doctor 19)
('dranh@hospital.com', '$2y$10$96uOlG86tdM2R.NL7gsG.upbyeBcM6T8IMUc9B1KhwBKymPYUQD/G', 'Dr. Nguyen Thi T', 'female', '1985-02-07', '0901234595', '151 Doctor St', 'active', 2), -- userId 22 (Doctor 20)
('drlinh@hospital.com', '$2y$10$96uOlG86tdM2R.NL7gsG.upbyeBcM6T8IMUc9B1KhwBKymPYUQD/G', 'Dr. Le Hoang U', 'male', '1979-07-25', '0901234596', '152 Doctor St', 'active', 2), -- userId 23 (Doctor 21)
('drtien@hospital.com', '$2y$10$96uOlG86tdM2R.NL7gsG.upbyeBcM6T8IMUc9B1KhwBKymPYUQD/G', 'Dr. Tran Minh V', 'male', '1986-11-09', '0901234597', '153 Doctor St', 'active', 2), -- userId 24 (Doctor 22)

-- Patients (roleId = 3)
('patient1@example.com', '$2y$10$96uOlG86tdM2R.NL7gsG.upbyeBcM6T8IMUc9B1KhwBKymPYUQD/G', 'Nguyen Van X', 'male', '1990-06-11', '0901234574', '130 Patient St', 'active', 3), -- userId 25 (Patient 1)
('patient2@example.com', '$2y$10$96uOlG86tdM2R.NL7gsG.upbyeBcM6T8IMUc9B1KhwBKymPYUQD/G', 'Tran Thi Y', 'female', '1995-08-19', '0901234575', '131 Patient St', 'active', 3), -- userId 26 (Patient 2)
('patient3@example.com', '$2y$10$96uOlG86tdM2R.NL7gsG.upbyeBcM6T8IMUc9B1KhwBKymPYUQD/G', 'Le Van Z', 'male', '1988-10-30', '0901234576', '132 Patient St', 'active', 3), -- userId 27 (Patient 3)
('patient4@example.com', '$2y$10$96uOlG86tdM2R.NL7gsG.upbyeBcM6T8IMUc9B1KhwBKymPYUQD/G', 'Pham Van K', 'male', '2001-04-14', '0901234577', '133 Patient St', 'active', 3), -- userId 28 (Patient 4)
('patient5@example.com', '$2y$10$96uOlG86tdM2R.NL7gsG.upbyeBcM6T8IMUc9B1KhwBKymPYUQD/G', 'Hoang Thi L', 'female', '1992-11-07', '0901234578', '134 Patient St', 'active', 3), -- userId 29 (Patient 5)
('patient6@example.com', '$2y$10$96uOlG86tdM2R.NL7gsG.upbyeBcM6T8IMUc9B1KhwBKymPYUQD/G', 'Dang Thi Cam', 'female', '1986-03-08', '0901234610', '160 Patient St', 'active', 3), -- userId 30 (Patient 6)
('patient7@example.com', '$2y$10$96uOlG86tdM2R.NL7gsG.upbyeBcM6T8IMUc9B1KhwBKymPYUQD/G', 'Bui Van Dung', 'male', '1996-06-17', '0901234611', '161 Patient St', 'active', 3), -- userId 31 (Patient 7)
('patient8@example.com', '$2y$10$96uOlG86tdM2R.NL7gsG.upbyeBcM6T8IMUc9B1KhwBKymPYUQD/G', 'Nguyen Thi Em', 'female', '1989-09-25', '0901234612', '162 Patient St', 'active', 3), -- userId 32 (Patient 8)
('patient9@example.com', '$2y$10$96uOlG86tdM2R.NL7gsG.upbyeBcM6T8IMUc9B1KhwBKymPYUQD/G', 'Tran Van Giang', 'male', '1979-02-04', '0901234613', '163 Patient St', 'active', 3), -- userId 33 (Patient 9)
('patient10@example.com', '$2y$10$96uOlG86tdM2R.NL7gsG.upbyeBcM6T8IMUc9B1KhwBKymPYUQD/G', 'Le Thi Huong', 'female', '1990-11-20', '0901234614', '164 Patient St', 'active', 3), -- userId 34 (Patient 10)
('patient11@example.com', '$2y$10$96uOlG86tdM2R.NL7gsG.upbyeBcM6T8IMUc9B1KhwBKymPYUQD/G', 'Pham Van Kien', 'male', '1993-04-12', '0901234615', '165 Patient St', 'active', 3), -- userId 35 (Patient 11)
('patient12@example.com', '$2y$10$96uOlG86tdM2R.NL7gsG.upbyeBcM6T8IMUc9B1KhwBKymPYUQD/G', 'Hoang Thi Lan', 'female', '1988-07-18', '0901234616', '166 Patient St', 'active', 3), -- userId 36 (Patient 12)
('patient13@example.com', '$2y$10$96uOlG86tdM2R.NL7gsG.upbyeBcM6T8IMUc9B1KhwBKymPYUQD/G', 'Cao Van Minh', 'male', '1981-05-23', '0901234617', '167 Patient St', 'active', 3), -- userId 37 (Patient 13)
('patient14@example.com', '$2y$10$96uOlG86tdM2R.NL7gsG.upbyeBcM6T8IMUc9B1KhwBKymPYUQD/G', 'Dinh Thi Nga', 'female', '1997-01-30', '0901234618', '168 Patient St', 'active', 3), -- userId 38 (Patient 14)
('patient15@example.com', '$2y$10$96uOlG86tdM2R.NL7gsG.upbyeBcM6T8IMUc9B1KhwBKymPYUQD/G', 'Truong Van Phuc', 'male', '1984-10-15', '0901234619', '169 Patient St', 'active', 3), -- userId 39 (Patient 15)
('patient16@example.com', '$2y$10$96uOlG86tdM2R.NL7gsG.upbyeBcM6T8IMUc9B1KhwBKymPYUQD/G', 'Vo Thi Quynh', 'female', '1992-08-14', '0901234629', '170 Patient St', 'active', 3), -- userId 40 (Patient 16)
('patient17@example.com', '$2y$10$96uOlG86tdM2R.NL7gsG.upbyeBcM6T8IMUc9B1KhwBKymPYUQD/G', 'Dang Van Son', 'male', '1987-09-09', '0901234630', '171 Patient St', 'active', 3), -- userId 41 (Patient 17)
('patient18@example.com', '$2y$10$96uOlG86tdM2R.NL7gsG.upbyeBcM6T8IMUc9B1KhwBKymPYUQD/G', 'Bui Thi Thao', 'female', '1994-12-18', '0901234631', '172 Patient St', 'active', 3), -- userId 42 (Patient 18)
('patient19@example.com', '$2y$10$96uOlG86tdM2R.NL7gsG.upbyeBcM6T8IMUc9B1KhwBKymPYUQD/G', 'Nguyen Van Uyen', 'male', '1980-02-21', '0901234632', '173 Patient St', 'active', 3), -- userId 43 (Patient 19)
('patient20@example.com', '$2y$10$96uOlG86tdM2R.NL7gsG.upbyeBcM6T8IMUc9B1KhwBKymPYUQD/G', 'Tran Thi Van', 'female', '1998-11-12', '0901234633', '174 Patient St', 'active', 3), -- userId 44 (Patient 20)
('patient21@example.com', '$2y$10$96uOlG86tdM2R.NL7gsG.upbyeBcM6T8IMUc9B1KhwBKymPYUQD/G', 'Dang Thi Cam', 'female', '1986-03-08', '0901234610', '160 Patient St', 'active', 3), -- userId 45 (Patient 21)
('patient22@example.com', '$2y$10$96uOlG86tdM2R.NL7gsG.upbyeBcM6T8IMUc9B1KhwBKymPYUQD/G', 'Bui Van Dung', 'male', '1996-06-17', '0901234611', '161 Patient St', 'active', 3), -- userId 46 (Patient 22)
('patient23@example.com', '$2y$10$96uOlG86tdM2R.NL7gsG.upbyeBcM6T8IMUc9B1KhwBKymPYUQD/G', 'Nguyen Thi Em', 'female', '1989-09-25', '0901234612', '162 Patient St', 'active', 3), -- userId 47 (Patient 23)
('patient24@example.com', '$2y$10$96uOlG86tdM2R.NL7gsG.upbyeBcM6T8IMUc9B1KhwBKymPYUQD/G', 'Tran Van Giang', 'male', '1979-02-04', '0901234613', '163 Patient St', 'active', 3), -- userId 48 (Patient 24)
('patient25@example.com', '$2y$10$96uOlG86tdM2R.NL7gsG.upbyeBcM6T8IMUc9B1KhwBKymPYUQD/G', 'Le Thi Huong', 'female', '1990-11-20', '0901234614', '164 Patient St', 'active', 3), -- userId 49 (Patient 25)
('patient26@example.com', '$2y$10$96uOlG86tdM2R.NL7gsG.upbyeBcM6T8IMUc9B1KhwBKymPYUQD/G', 'Pham Van Kien', 'male', '1993-04-12', '0901234615', '165 Patient St', 'active', 3), -- userId 50 (Patient 26)
('patient27@example.com', '$2y$10$96uOlG86tdM2R.NL7gsG.upbyeBcM6T8IMUc9B1KhwBKymPYUQD/G', 'Hoang Thi Lan', 'female', '1988-07-18', '0901234616', '166 Patient St', 'active', 3), -- userId 51 (Patient 27)
('patient28@example.com', '$2y$10$96uOlG86tdM2R.NL7gsG.upbyeBcM6T8IMUc9B1KhwBKymPYUQD/G', 'Cao Van Minh', 'male', '1981-05-23', '0901234617', '167 Patient St', 'active', 3), -- userId 52 (Patient 28)
('patient29@example.com', '$2y$10$96uOlG86tdM2R.NL7gsG.upbyeBcM6T8IMUc9B1KhwBKymPYUQD/G', 'Dinh Thi Nga', 'female', '1997-01-30', '0901234618', '168 Patient St', 'active', 3), -- userId 53 (Patient 29)
('patient30@example.com', '$2y$10$96uOlG86tdM2R.NL7gsG.upbyeBcM6T8IMUc9B1KhwBKymPYUQD/G', 'Truong Van Phuc', 'male', '1984-10-15', '0901234619', '169 Patient St', 'active', 3), -- userId 54 (Patient 30)
('patient31@example.com', '$2y$10$96uOlG86tdM2R.NL7gsG.upbyeBcM6T8IMUc9B1KhwBKymPYUQD/G', 'Vo Thi Quynh', 'female', '1992-08-14', '0901234629', '170 Patient St', 'active', 3), -- userId 55 (Patient 31)
('patient32@example.com', '$2y$10$96uOlG86tdM2R.NL7gsG.upbyeBcM6T8IMUc9B1KhwBKymPYUQD/G', 'Dang Van Son', 'male', '1987-09-09', '0901234630', '171 Patient St', 'active', 3), -- userId 56 (Patient 32)
('patient33@example.com', '$2y$10$96uOlG86tdM2R.NL7gsG.upbyeBcM6T8IMUc9B1KhwBKymPYUQD/G', 'Bui Thi Thao', 'female', '1994-12-18', '0901234631', '172 Patient St', 'active', 3), -- userId 57 (Patient 33)
('patient34@example.com', '$2y$10$96uOlG86tdM2R.NL7gsG.upbyeBcM6T8IMUc9B1KhwBKymPYUQD/G', 'Nguyen Van Uyen', 'male', '1980-02-21', '0901234632', '173 Patient St', 'active', 3), -- userId 58 (Patient 34)
('patient35@example.com', '$2y$10$96uOlG86tdM2R.NL7gsG.upbyeBcM6T8IMUc9B1KhwBKymPYUQD/G', 'Tran Thi Van', 'female', '1998-11-12', '0901234633', '174 Patient St', 'active', 3), -- userId 59 (Patient 35)
('patient36@example.com', '$2y$10$96uOlG86tdM2R.NL7gsG.upbyeBcM6T8IMUc9B1KhwBKymPYUQD/G', 'Le Van Xuan', 'male', '1991-03-07', '0901234634', '175 Patient St', 'active', 3), -- userId 60 (Patient 36)
('patient37@example.com', '$2y$10$96uOlG86tdM2R.NL7gsG.upbyeBcM6T8IMUc9B1KhwBKymPYUQD/G', 'Pham Thi Yen', 'female', '1986-05-28', '0901234635', '176 Patient St', 'active', 3), -- userId 61 (Patient 37)
('patient38@example.com', '$2y$10$96uOlG86tdM2R.NL7gsG.upbyeBcM6T8IMUc9B1KhwBKymPYUQD/G', 'Hoang Van Anh', 'male', '1989-07-19', '0901234636', '177 Patient St', 'active', 3), -- userId 62 (Patient 38)
('patient39@example.com', '$2y$10$96uOlG86tdM2R.NL7gsG.upbyeBcM6T8IMUc9B1KhwBKymPYUQD/G', 'Cao Thi Binh', 'female', '1995-10-03', '0901234637', '178 Patient St', 'active', 3), -- userId 63 (Patient 39)
('patient40@example.com', '$2y$10$96uOlG86tdM2R.NL7gsG.upbyeBcM6T8IMUc9B1KhwBKymPYUQD/G', 'Dinh Van Cuong', 'male', '1982-12-22', '0901234638', '179 Patient St', 'active', 3), -- userId 64 (Patient 40)
('patient41@example.com', '$2y$10$96uOlG86tdM2R.NL7gsG.upbyeBcM6T8IMUc9B1KhwBKymPYUQD/G', 'Truong Thi Duyen', 'female', '1993-01-14', '0901234639', '180 Patient St', 'active', 3), -- userId 65 (Patient 41)
('patient42@example.com', '$2y$10$96uOlG86tdM2R.NL7gsG.upbyeBcM6T8IMUc9B1KhwBKymPYUQD/G', 'Vo Van Duy', 'male', '1988-04-02', '0901234640', '181 Patient St', 'active', 3), -- userId 66 (Patient 42)
('patient43@example.com', '$2y$10$96uOlG86tdM2R.NL7gsG.upbyeBcM6T8IMUc9B1KhwBKymPYUQD/G', 'Dang Thi Giang', 'female', '1996-06-30', '0901234641', '182 Patient St', 'active', 3), -- userId 67 (Patient 43)
('patient44@example.com', '$2y$10$96uOlG86tdM2R.NL7gsG.upbyeBcM6T8IMUc9B1KhwBKymPYUQD/G', 'Bui Van Hai', 'male', '1979-09-11', '0901234642', '183 Patient St', 'active', 3), -- userId 68 (Patient 44)
('patient45@example.com', '$2y$10$96uOlG86tdM2R.NL7gsG.upbyeBcM6T8IMUc9B1KhwBKymPYUQD/G', 'Nguyen Thi Hong', 'female', '1990-05-08', '0901234643', '184 Patient St', 'active', 3), -- userId 69 (Patient 45)
('patient46@example.com', '$2y$10$96uOlG86tdM2R.NL7gsG.upbyeBcM6T8IMUc9B1KhwBKymPYUQD/G', 'Tran Van Kien', 'male', '1983-08-25', '0901234644', '185 Patient St', 'active', 3), -- userId 70 (Patient 46)
('patient47@example.com', '$2y$10$96uOlG86tdM2R.NL7gsG.upbyeBcM6T8IMUc9B1KhwBKymPYUQD/G', 'Le Thi Loan', 'female', '1997-07-14', '0901234645', '186 Patient St', 'active', 3), -- userId 71 (Patient 47)
('patient48@example.com', '$2y$10$96uOlG86tdM2R.NL7gsG.upbyeBcM6T8IMUc9B1KhwBKymPYUQD/G', 'Pham Van Mai', 'male', '1984-03-29', '0901234646', '187 Patient St', 'active', 3), -- userId 72 (Patient 48)
('patient49@example.com', '$2y$10$96uOlG86tdM2R.NL7gsG.upbyeBcM6T8IMUc9B1KhwBKymPYUQD/G', 'Hoang Thi Nhung', 'female', '1992-10-17', '0901234647', '188 Patient St', 'active', 3), -- userId 73 (Patient 49)
('patient50@example.com', '$2y$10$96uOlG86tdM2R.NL7gsG.upbyeBcM6T8IMUc9B1KhwBKymPYUQD/G', 'Cao Van Phong', 'male', '1986-12-04', '0901234648', '189 Patient St', 'active', 3), -- userId 74 (Patient 50)

-- Lab Technicians (roleId = 4) - Added 10 users for technicians
('lab1@hospital.com', '$2y$10$96uOlG86tdM2R.NL7gsG.upbyeBcM6T8IMUc9B1KhwBKymPYUQD/G', 'Lab Tech 1', 'female', '1993-01-25', '0901234579', '135 Lab St', 'active', 4), -- userId 75 (Technician 1)
('lab2@hospital.com', '$2y$10$96uOlG86tdM2R.NL7gsG.upbyeBcM6T8IMUc9B1KhwBKymPYUQD/G', 'Lab Tech 2', 'male', '1996-05-09', '0901234580', '136 Lab St', 'active', 4), -- userId 76 (Technician 2)
('lab3@hospital.com', '$2y$10$96uOlG86tdM2R.NL7gsG.upbyeBcM6T8IMUc9B1KhwBKymPYUQD/G', 'Lab Tech 3', 'female', '1994-07-11', '0901234598', '154 Lab St', 'active', 4), -- userId 77 (Technician 3)
('lab4@hospital.com', '$2y$10$96uOlG86tdM2R.NL7gsG.upbyeBcM6T8IMUc9B1KhwBKymPYUQD/G', 'Lab Tech 4', 'male', '1990-11-05', '0901234599', '155 Lab St', 'active', 4), -- userId 78 (Technician 4)
('lab5@hospital.com', '$2y$10$96uOlG86tdM2R.NL7gsG.upbyeBcM6T8IMUc9B1KhwBKymPYUQD/G', 'Lab Tech 5', 'female', '1997-03-19', '0901234600', '156 Lab St', 'active', 4), -- userId 79 (Technician 5)
('lab6@hospital.com', '$2y$10$96uOlG86tdM2R.NL7gsG.upbyeBcM6T8IMUc9B1KhwBKymPYUQD/G', 'Lab Tech 6', 'male', '1991-08-24', '0901234601', '157 Lab St', 'active', 4), -- userId 80 (Technician 6)
('lab7@hospital.com', '$2y$10$96uOlG86tdM2R.NL7gsG.upbyeBcM6T8IMUc9B1KhwBKymPYUQD/G', 'Lab Tech 7', 'female', '1995-01-02', '0901234602', '158 Lab St', 'active', 4), -- userId 81 (Technician 7)
('lab8@hospital.com', '$2y$10$96uOlG86tdM2R.NL7gsG.upbyeBcM6T8IMUc9B1KhwBKymPYUQD/G', 'Lab Tech 8', 'male', '1993-06-15', '0901234603', '159 Lab St', 'active', 4), -- userId 82 (Technician 8)
('lab9@hospital.com', '$2y$10$96uOlG86tdM2R.NL7gsG.upbyeBcM6T8IMUc9B1KhwBKymPYUQD/G', 'Lab Tech 9', 'female', '1996-10-28', '0901234604', '160 Lab St', 'active', 4), -- userId 83 (Technician 9)
('lab10@hospital.com', '$2y$10$96uOlG86tdM2R.NL7gsG.upbyeBcM6T8IMUc9B1KhwBKymPYUQD/G', 'Lab Tech 10', 'male', '1990-04-03', '0901234605', '161 Lab St', 'active', 4); -- userId 84 (Technician 10)

-- Insert sample data into Hospital table
INSERT INTO Hospital (name, address, phoneNumber, email, website, description, workingHours) VALUES
('Main Hospital', '123 Main Street, Ho Chi Minh City', '0283123456', 'info@hospital.com', 'www.hospital.com', 'Main hospital branch with full services', 'Monday-Friday: 7:00-19:00, Weekend: 8:00-17:00');

-- Insert sample data into Notification table
-- User IDs 1-84 are now available. Adjusted patient User IDs based on the new User insert order.
INSERT INTO Notification (userId, title, content, isRead) VALUES
(1, 'System Update', 'The system will be updated tonight. Please save your work.', false), -- Admin 1
(3, 'Appointment Reminder', 'You have an appointment tomorrow at 10:00 AM.', false), -- Doctor 1 (userId 3)
(25, 'Test Results Ready', 'Your test results are ready. Please check with your doctor.', false), -- Patient 1 (userId 25)
(26, 'Appointment Confirmed', 'Your appointment has been confirmed for next Monday.', true), -- Patient 2 (userId 26)
(27, 'Medication Reminder', 'Remember to take your prescribed medication.', false), -- Patient 3 (userId 27)
(28, 'Schedule Change', 'Your appointment has been rescheduled to Wednesday at 2:00 PM.', false), -- Patient 4 (userId 28)
(29, 'New Message', 'You have a new message from Dr. Smith.', true), -- Patient 5 (userId 29)
(30, 'Account Update', 'Your account information has been updated successfully.', true), -- Patient 6 (userId 30)
(31, 'Billing Information', 'Your latest invoice is now available in your account.', false), -- Patient 7 (userId 31)
(32, 'Service Update', 'Our hospital now offers new pediatric services.', true), -- Patient 8 (userId 32)
(33, 'Holiday Schedule', 'Please note our holiday working hours for the upcoming week.', false), -- Patient 9 (userId 33)
(34, 'Health Tips', 'New health tips available on our portal.', true), -- Patient 10 (userId 34)
(35, 'System Maintenance', 'The system will undergo maintenance this weekend.', false), -- Patient 11 (userId 35)
(36, 'Insurance Update', 'Your insurance details have been updated in our system.', true), -- Patient 12 (userId 36)
(37, 'Feedback Request', 'Please take a moment to provide feedback on your recent visit.', false); -- Patient 13 (userId 37)


-- Insert sample data into Patient table
-- User IDs 25 through 74 are patient users
INSERT INTO Patient (userId, dob, gender, bloodType, medicalHistory) VALUES
(25, '1990-05-15', 'male', 'O+', 'No major medical history.'), -- Patient ID 1 (userId 25)
(26, '1985-10-20', 'female', 'A-', 'Allergic to penicillin.'), -- Patient ID 2 (userId 26)
(27, '1978-03-25', 'male', 'B+', 'Hypertension.'), -- Patient ID 3 (userId 27)
(28, '1995-08-12', 'male', 'AB+', 'No major medical history.'), -- Patient ID 4 (userId 28)
(29, '1988-11-30', 'female', 'O-', 'Asthma, Diabetes Type 2.'), -- Patient ID 5 (userId 29)
(30, '1986-03-08', 'female', 'A+', 'Previous appendectomy.'), -- Patient ID 6 (userId 30)
(31, '1996-06-17', 'male', 'B-', 'Allergic to shellfish.'), -- Patient ID 7 (userId 31)
(32, '1989-09-25', 'female', 'O+', 'Coronary artery disease.'), -- Patient ID 8 (userId 32)
(33, '1979-02-04', 'male', 'AB-', 'No major medical history.'), -- Patient ID 9 (userId 33)
(34, '1990-11-20', 'female', 'A+', 'Mild asthma.'), -- Patient ID 10 (userId 34)
(35, '1993-04-12', 'male', 'B+', 'No major medical history.'), -- Patient ID 11 (userId 35)
(36, '1988-07-18', 'female', 'O+', 'Type 2 diabetes.'), -- Patient ID 12 (userId 36)
(37, '1981-05-23', 'male', 'A-', 'History of fractures.'), -- Patient ID 13 (userId 37)
(38, '1997-01-30', 'female', 'AB+', 'Allergic to latex.'), -- Patient ID 14 (userId 38)
(39, '1984-10-15', 'male', 'O+', 'Hypertension, high cholesterol.'), -- Patient ID 15 (userId 39)
(40, '1992-08-14', 'female', 'B-', 'No major medical history.'), -- Patient ID 16 (userId 40)
(41, '1987-09-09', 'male', 'A+', 'Anemia.'), -- Patient ID 17 (userId 41)
(42, '1994-12-18', 'female', 'O-', 'Previous surgery for hernia.'), -- Patient ID 18 (userId 42)
(43, '1980-02-21', 'male', 'AB+', 'No major medical history.'), -- Patient ID 19 (userId 43)
(44, '1998-11-12', 'female', 'B+', 'Chronic back pain.'), -- Patient ID 20 (userId 44)
(45, '1986-03-08', 'female', 'A+', 'Migraine sufferer.'), -- Patient ID 21 (userId 45)
(46, '1996-06-17', 'male', 'O+', 'No major medical history.'), -- Patient ID 22 (userId 46)
(47, '1989-09-25', 'female', 'AB-', 'Thyroid disorder.'), -- Patient ID 23 (userId 47)
(48, '1979-02-04', 'male', 'B+', 'History of kidney stones.'), -- Patient ID 24 (userId 48)
(49, '1990-11-20', 'female', 'A+', 'Seasonal allergies.'), -- Patient ID 25 (userId 49)
(50, '1993-04-12', 'male', 'O+', 'No major medical history.'), -- Patient ID 26 (userId 50)
(51, '1988-07-18', 'female', 'B-', 'Previous appendectomy.'), -- Patient ID 27 (userId 51)
(52, '1981-05-23', 'male', 'AB+', 'Heart murmur.'), -- Patient ID 28 (userId 52)
(53, '1997-01-30', 'female', 'O+', 'No major medical history.'), -- Patient ID 29 (userId 53)
(54, '1984-10-15', 'male', 'A-', 'Mild hypertension.'), -- Patient ID 30 (userId 54)
(55, '1992-08-14', 'female', 'B+', 'No major medical history.'), -- Patient ID 31 (userId 55)
(56, '1987-09-09', 'male', 'O+', 'Previous knee surgery.'), -- Patient ID 32 (userId 56)
(57, '1994-12-18', 'female', 'AB+', 'Allergies to pollen.'), -- Patient ID 33 (userId 57)
(58, '1980-02-21', 'male', 'A+', 'GERD.'), -- Patient ID 34 (userId 58)
(59, '1998-11-12', 'female', 'O-', 'No major medical history.'), -- Patient ID 35 (userId 59)
(60, '1991-03-07', 'male', 'B+', 'History of concussion.'), -- Patient ID 36 (userId 60)
(61, '1986-05-28', 'female', 'AB-', 'Chronic sinusitis.'), -- Patient ID 37 (userId 61)
(62, '1989-07-19', 'male', 'O+', 'No major medical history.'), -- Patient ID 38 (userId 62)
(63, '1995-10-03', 'female', 'A+', 'Eczema.'), -- Patient ID 39 (userId 63)
(64, '1982-12-22', 'male', 'B+', 'Type 1 diabetes.'), -- Patient ID 40 (userId 64)
(65, '1993-01-14', 'female', 'O+', 'No major medical history.'), -- Patient ID 41 (userId 65)
(66, '1988-04-02', 'male', 'AB+', 'Asthma.'), -- Patient ID 42 (userId 66)
(67, '1996-06-30', 'female', 'A-', 'Allergic to nuts.'), -- Patient ID 43 (userId 67)
(68, '1979-09-11', 'male', 'B+', 'Previous hip replacement.'), -- Patient ID 44 (userId 68)
(69, '1990-05-08', 'female', 'O+', 'No major medical history.'), -- Patient ID 45 (userId 69)
(70, '1983-08-25', 'male', 'A+', 'High cholesterol.'), -- Patient ID 46 (userId 70)
(71, '1997-07-14', 'female', 'AB+', 'No major medical history.'), -- Patient ID 47 (userId 71)
(72, '1984-03-29', 'male', 'O+', 'Sleep apnea.'), -- Patient ID 48 (userId 72)
(73, '1992-10-17', 'female', 'B-', 'No major medical history.'), -- Patient ID 49 (userId 73)
(74, '1986-12-04', 'male', 'A+', 'Irritable bowel syndrome.'); -- Patient ID 50 (userId 74)


-- Insert sample data into Administrator table
-- User IDs 1 and 2 are admin users
INSERT INTO Administrator (userId, position) VALUES
(1, 'System Administrator'),
(2, 'Hospital Manager');

-- Insert sample data into Specialty table (10 specialties)
-- Hospital ID 1 is the Main Hospital
INSERT INTO Specialty (name, description, hospitalId) VALUES
('Cardiology', 'Deals with disorders of the heart and cardiovascular system', 1), -- Specialty ID 1
('Dermatology', 'Focused on diagnosing and treating skin disorders', 1), -- Specialty ID 2
('Neurology', 'Deals with disorders of the nervous system', 1), -- Specialty ID 3
('Orthopedics', 'Focused on conditions involving the musculoskeletal system', 1), -- Specialty ID 4
('Pediatrics', 'Medical care of infants, children, and adolescents', 1), -- Specialty ID 5
('Gastroenterology', 'Specializes in digestive system disorders', 1), -- Specialty ID 6
('Ophthalmology', 'Deals with eye disorders and vision care', 1), -- Specialty ID 7
('Pulmonology', 'Focuses on respiratory system diseases', 1), -- Specialty ID 8
('Endocrinology', 'Specializes in hormone-related disorders', 1), -- Specialty ID 9
('Oncology', 'Focused on the diagnosis and treatment of cancer', 1); -- Specialty ID 10

-- Insert sample data into Room table (20 rooms)
-- Specialty IDs 1-10 are available
INSERT INTO Room (roomNumber, specialtyId, capacity, roomType, status, description) VALUES
-- Cardiology Rooms (Specialty ID 1)
('C101', 1, 2, 'examination', 'available', 'Cardiology examination room'), -- Room ID 1
('C102', 1, 2, 'examination', 'available', 'Cardiology examination room'), -- Room ID 2
('C103', 1, 4, 'operation', 'available', 'Cardiology operation room'), -- Room ID 3

-- Dermatology Rooms (Specialty ID 2)
('D201', 2, 2, 'examination', 'available', 'Dermatology examination room'), -- Room ID 4
('D202', 2, 2, 'examination', 'available', 'Dermatology procedural room'), -- Room ID 5

-- Neurology Rooms (Specialty ID 3)
('N301', 3, 2, 'examination', 'available', 'Neurology examination room'), -- Room ID 6
('N302', 3, 2, 'examination', 'available', 'Neurological testing room'), -- Room ID 7
('N303', 3, 1, 'laboratory', 'available', 'Neurology lab room'), -- Room ID 8

-- Orthopedics Rooms (Specialty ID 4)
('O401', 4, 2, 'examination', 'available', 'Orthopedics examination room'), -- Room ID 9
('O402', 4, 3, 'operation', 'available', 'Orthopedic procedure room'), -- Room ID 10

-- Pediatrics Rooms (Specialty ID 5)
('P501', 5, 2, 'examination', 'available', 'Pediatrics examination room'), -- Room ID 11
('P502', 5, 3, 'examination', 'available', 'Pediatric treatment room'), -- Room ID 12

-- Gastroenterology Rooms (Specialty ID 6)
('G601', 6, 2, 'examination', 'available', 'Gastroenterology consultation room'), -- Room ID 13
('G602', 6, 3, 'examination', 'available', 'Endoscopy room'), -- Room ID 14

-- Ophthalmology Rooms (Specialty ID 7)
('E701', 7, 2, 'examination', 'available', 'Eye examination room'), -- Room ID 15
('E702', 7, 2, 'examination', 'available', 'Vision testing room'), -- Room ID 16

-- Pulmonology Rooms (Specialty ID 8)
('U801', 8, 2, 'examination', 'available', 'Pulmonology consultation room'), -- Room ID 17
('U802', 8, 3, 'laboratory', 'available', 'Respiratory testing lab'), -- Room ID 18

-- Endocrinology Rooms (Specialty ID 9)
('EN901', 9, 2, 'examination', 'available', 'Endocrinology consultation room'), -- Room ID 19

-- Oncology Rooms (Specialty ID 10)
('ON1001', 10, 2, 'examination', 'available', 'Oncology consultation room'); -- Room ID 20

-- Insert sample data into Doctor table (22 doctors)
-- User IDs 3 through 24 are doctor users
-- Specialty IDs 1-10 are available
INSERT INTO Doctor (userId, specialtyId, licenseNumber, experience, education, bio) VALUES
-- Cardiology Doctors (Specialty ID 1)
(3, 1, 'DOC-CARD-123456', 10, 'MD from Harvard Medical School', 'Experienced cardiologist with focus on heart disease prevention.'), -- Doctor ID 1 (userId 3)
(6, 1, 'DOC-CARD-123459', 8, 'MD from Stanford Medical School', 'Specializes in interventional cardiology and heart rhythm disorders.'), -- Doctor ID 2 (userId 6)

-- Dermatology Doctors (Specialty ID 2)
(4, 2, 'DOC-DERM-123457', 8, 'MD from Stanford Medical School', 'Specialist in skin cancer and aesthetic dermatology.'), -- Doctor ID 3 (userId 4)
(7, 2, 'DOC-DERM-123460', 12, 'MD from Johns Hopkins University', 'Expert in pediatric dermatology and skin allergies.'), -- Doctor ID 4 (userId 7)

-- Neurology Doctors (Specialty ID 3)
(5, 3, 'DOC-NEUR-123458', 12, 'MD from Johns Hopkins University', 'Neurologist with expertise in stroke treatment and prevention.'), -- Doctor ID 5 (userId 5)
(8, 3, 'DOC-NEUR-123461', 9, 'MD from Yale University', 'Specializes in neurodegenerative disorders and headaches.'), -- Doctor ID 6 (userId 8)

-- Orthopedics Doctors (Specialty ID 4)
(9, 4, 'DOC-ORTH-123462', 15, 'MD from Yale University', 'Orthopedic surgeon specializing in sports injuries.'), -- Doctor ID 7 (userId 9)
(10, 4, 'DOC-ORTH-123463', 11, 'MD from Columbia University', 'Expert in joint replacement and trauma surgery.'), -- Doctor ID 8 (userId 10)

-- Pediatrics Doctors (Specialty ID 5)
(11, 5, 'DOC-PED-123464', 7, 'MD from Columbia University', 'Pediatrician with focus on early childhood development.'), -- Doctor ID 9 (userId 11)
(12, 5, 'DOC-PED-123465', 14, 'MD from University of Pennsylvania', 'Specializes in pediatric pulmonology and allergies.'), -- Doctor ID 10 (userId 12)

-- Gastroenterology Doctors (Specialty ID 6)
(13, 6, 'DOC-GAST-123466', 9, 'MD from Duke University', 'Gastroenterologist with expertise in IBD and GERD.'), -- Doctor ID 11 (userId 13)
(14, 6, 'DOC-GAST-123467', 13, 'MD from UCLA', 'Specializes in advanced endoscopic procedures.'), -- Doctor ID 12 (userId 14)

-- Ophthalmology Doctors (Specialty ID 7)
(15, 7, 'DOC-OPHT-123468', 16, 'MD from Washington University', 'Ophthalmologist with focus on cataract and LASIK surgery.'), -- Doctor ID 13 (userId 15)
(16, 7, 'DOC-OPHT-123469', 8, 'MD from University of Michigan', 'Specializes in retinal disorders and diabetic eye disease.'), -- Doctor ID 14 (userId 16)

-- Pulmonology Doctors (Specialty ID 8)
(17, 8, 'DOC-PULM-123470', 11, 'MD from NYU', 'Pulmonologist with expertise in COPD and asthma management.'), -- Doctor ID 15 (userId 17)
(18, 8, 'DOC-PULM-123471', 7, 'MD from Emory University', 'Specializes in sleep disorders and respiratory infections.'), -- Doctor ID 16 (userId 18)

-- Endocrinology Doctors (Specialty ID 9)
(19, 9, 'DOC-ENDO-123472', 10, 'MD from University of Chicago', 'Endocrinologist focusing on diabetes and thyroid disorders.'), -- Doctor ID 17 (userId 19)
(20, 9, 'DOC-ENDO-123473', 14, 'MD from UCSF', 'Expert in metabolic disorders and hormone replacement therapy.'), -- Doctor ID 18 (userId 20)

-- Oncology Doctors (Specialty ID 10)
(21, 10, 'DOC-ONC-123474', 18, 'MD from Mayo Clinic', 'Oncologist specializing in breast and lung cancers.'), -- Doctor ID 19 (userId 21)
(22, 10, 'DOC-ONC-123475', 12, 'MD from Memorial Sloan Kettering', 'Expert in targeted therapies and immunotherapy.'); -- Doctor ID 20 (userId 22)


-- Update Specialty headDoctorId (assign head doctor for each specialty)
-- Doctor IDs 1-20 are available (Note: User IDs 3-22 are the doctors)
UPDATE Specialty SET headDoctorId = 1 WHERE specialtyId = 1; -- Cardiology (Doctor ID 1, User ID 3)
UPDATE Specialty SET headDoctorId = 3 WHERE specialtyId = 2; -- Dermatology (Doctor ID 3, User ID 4)
UPDATE Specialty SET headDoctorId = 5 WHERE specialtyId = 3; -- Neurology (Doctor ID 5, User ID 5)
UPDATE Specialty SET headDoctorId = 7 WHERE specialtyId = 4; -- Orthopedics (Doctor ID 7, User ID 9)
UPDATE Specialty SET headDoctorId = 9 WHERE specialtyId = 5; -- Pediatrics (Doctor ID 9, User ID 11)
UPDATE Specialty SET headDoctorId = 11 WHERE specialtyId = 6; -- Gastroenterology (Doctor ID 11, User ID 13)
UPDATE Specialty SET headDoctorId = 13 WHERE specialtyId = 7; -- Ophthalmology (Doctor ID 13, User ID 15)
UPDATE Specialty SET headDoctorId = 15 WHERE specialtyId = 8; -- Pulmonology (Doctor ID 15, User ID 17)
UPDATE Specialty SET headDoctorId = 17 WHERE specialtyId = 9; -- Endocrinology (Doctor ID 17, User ID 19)
UPDATE Specialty SET headDoctorId = 19 WHERE specialtyId = 10; -- Oncology (Doctor ID 19, User ID 21)


-- Insert sample data into LabTechnician table (10 lab technicians)
-- User IDs 75 through 84 are lab technician users (Aligned with the new User insert order)
-- Specialty IDs 1-10 are available (linking technicians to relevant specialties)
INSERT INTO LabTechnician (userId, specialization, specialtyId) VALUES
(75, 'Blood Analysis', 1), -- Technician ID 1 (User 75)
(76, 'Genetic Testing', 2), -- Technician ID 2 (User 76)
(77, 'Neurological Testing', 3), -- Technician ID 3 (User 77)
(78, 'X-ray and Imaging', 4), -- Technician ID 4 (User 78)
(79, 'Pediatric Lab Testing', 5), -- Technician ID 5 (User 79)
(80, 'Endoscopy Assistance', 6), -- Technician ID 6 (User 80)
(81, 'Vision Testing', 7), -- Technician ID 7 (User 81)
(82, 'Respiratory Analysis', 8), -- Technician ID 8 (User 82)
(83, 'Hormone Testing', 9), -- Technician ID 9 (User 83)
(84, 'Oncology Specimen Analysis', 10); -- Technician ID 10 (User 84)


-- Insert sample data into Schedule table for doctors and lab technicians
-- Doctor IDs 1-20, Lab Technician IDs 1-10, Room IDs 1-20 are available
INSERT INTO Schedule (doctorId, labTechnicianId, roomId, workDate, startTime, endTime, status) VALUES
-- Doctor Schedules
-- Cardiology Doctors (Specialty ID 1)
(1, NULL, 1, CURDATE(), '07:00:00', '11:30:00', 'available'), -- Schedule ID 1 (Doctor 1, Room 1)
(1, NULL, 1, CURDATE() + INTERVAL 1 DAY, '07:00:00', '11:30:00', 'available'), -- Schedule ID 2 (Doctor 1, Room 1)
(1, NULL, 1, CURDATE() + INTERVAL 2 DAY, '13:00:00', '16:30:00', 'available'), -- Schedule ID 3 (Doctor 1, Room 1)
(2, NULL, 2, CURDATE(), '13:00:00', '16:30:00', 'available'), -- Schedule ID 4 (Doctor 2, Room 2)
(2, NULL, 2, CURDATE() + INTERVAL 1 DAY, '07:00:00', '11:30:00', 'available'), -- Schedule ID 5 (Doctor 2, Room 2)

-- Dermatology Doctors (Specialty ID 2)
(3, NULL, 4, CURDATE(), '07:00:00', '11:30:00', 'available'), -- Schedule ID 6 (Doctor 3, Room 4)
(3, NULL, 4, CURDATE() + INTERVAL 1 DAY, '13:00:00', '16:30:00', 'available'), -- Schedule ID 7 (Doctor 3, Room 4)
(4, NULL, 5, CURDATE() + INTERVAL 2 DAY, '07:00:00', '11:30:00', 'available'), -- Schedule ID 8 (Doctor 4, Room 5)

-- Neurology Doctors (Specialty ID 3)
(5, NULL, 6, CURDATE(), '07:00:00', '11:30:00', 'available'), -- Schedule ID 9 (Doctor 5, Room 6)
(5, NULL, 6, CURDATE() + INTERVAL 1 DAY, '13:00:00', '16:30:00', 'available'), -- Schedule ID 10 (Doctor 5, Room 6)
(6, NULL, 7, CURDATE() + INTERVAL 2 DAY, '07:00:00', '11:30:00', 'available'), -- Schedule ID 11 (Doctor 6, Room 7)

-- Orthopedics Doctors (Specialty ID 4)
(7, NULL, 9, CURDATE(), '13:00:00', '16:30:00', 'available'), -- Schedule ID 12 (Doctor 7, Room 9)
(7, NULL, 9, CURDATE() + INTERVAL 1 DAY, '07:00:00', '11:30:00', 'available'), -- Schedule ID 13 (Doctor 7, Room 9)
(8, NULL, 10, CURDATE() + INTERVAL 2 DAY, '13:00:00', '16:30:00', 'available'), -- Schedule ID 14 (Doctor 8, Room 10)

-- Pediatrics Doctors (Specialty ID 5)
(9, NULL, 11, CURDATE(), '07:00:00', '11:30:00', 'available'), -- Schedule ID 15 (Doctor 9, Room 11)
(9, NULL, 11, CURDATE() + INTERVAL 1 DAY, '13:00:00', '16:30:00', 'available'), -- Schedule ID 16 (Doctor 9, Room 11)
(10, NULL, 12, CURDATE() + INTERVAL 2 DAY, '07:00:00', '11:30:00', 'available'), -- Schedule ID 17 (Doctor 10, Room 12)

-- Gastroenterology Doctors (Specialty ID 6)
(11, NULL, 13, CURDATE(), '13:00:00', '16:30:00', 'available'), -- Schedule ID 18 (Doctor 11, Room 13)
(11, NULL, 13, CURDATE() + INTERVAL 1 DAY, '07:00:00', '11:30:00', 'available'), -- Schedule ID 19 (Doctor 11, Room 13)
(12, NULL, 14, CURDATE() + INTERVAL 2 DAY, '13:00:00', '16:30:00', 'available'), -- Schedule ID 20 (Doctor 12, Room 14)

-- Ophthalmology Doctors (Specialty ID 7)
(13, NULL, 15, CURDATE(), '07:00:00', '11:30:00', 'available'), -- Schedule ID 21 (Doctor 13, Room 15)
(14, NULL, 16, CURDATE() + INTERVAL 1 DAY, '13:00:00', '16:30:00', 'available'), -- Schedule ID 22 (Doctor 14, Room 16)

-- Pulmonology Doctors (Specialty ID 8)
(15, NULL, 17, CURDATE(), '13:00:00', '16:30:00', 'available'), -- Schedule ID 23 (Doctor 15, Room 17)
(16, NULL, 18, CURDATE() + INTERVAL 1 DAY, '07:00:00', '11:30:00', 'available'), -- Schedule ID 24 (Doctor 16, Room 18)

-- Endocrinology Doctors (Specialty ID 9)
(17, NULL, 19, CURDATE(), '07:00:00', '11:30:00', 'available'), -- Schedule ID 25 (Doctor 17, Room 19)
(18, NULL, 19, CURDATE() + INTERVAL 1 DAY, '13:00:00', '16:30:00', 'available'), -- Schedule ID 26 (Doctor 18, Room 19)

-- Oncology Doctors (Specialty ID 10)
(19, NULL, 20, CURDATE(), '13:00:00', '16:30:00', 'available'), -- Schedule ID 27 (Doctor 19, Room 20)
(20, NULL, 20, CURDATE() + INTERVAL 1 DAY, '07:00:00', '11:30:00', 'available'), -- Schedule ID 28 (Doctor 20, Room 20)

-- Lab Technician Schedules
-- Cardiology Lab Technician (Specialty ID 1)
(NULL, 1, 3, CURDATE(), '07:00:00', '11:30:00', 'available'), -- Schedule ID 29 (Tech 1, Room 3)
(NULL, 1, 3, CURDATE() + INTERVAL 1 DAY, '13:00:00', '16:30:00', 'available'), -- Schedule ID 30 (Tech 1, Room 3)

-- Dermatology Lab Technician (Specialty ID 2)
-- FIX: Changed Room ID from 5 to 4 to avoid conflict with Doctor 4 on CURDATE() + INTERVAL 2 DAY, 07:00:00
(NULL, 2, 4, CURDATE() + INTERVAL 2 DAY, '07:00:00', '11:30:00', 'available'), -- Schedule ID 31 (Tech 2, Room 4)
(NULL, 2, 5, CURDATE(), '13:00:00', '16:30:00', 'available'), -- Schedule ID 32 (Tech 2, Room 5)


-- Neurology Lab Technician (Specialty ID 3)
(NULL, 3, 8, CURDATE(), '07:00:00', '11:30:00', 'available'), -- Schedule ID 33 (Tech 3, Room 8)
(NULL, 3, 8, CURDATE() + INTERVAL 1 DAY, '13:00:00', '16:30:00', 'available'), -- Schedule ID 34 (Tech 3, Room 8)

-- Orthopedics Lab Technician (Specialty ID 4)
(NULL, 4, 10, CURDATE(), '13:00:00', '16:30:00', 'available'), -- Schedule ID 35 (Tech 4, Room 10)
(NULL, 4, 10, CURDATE() + INTERVAL 2 DAY, '07:00:00', '11:30:00', 'available'), -- Schedule ID 36 (Tech 4, Room 10)

-- Pulmonology Lab Technician (Specialty ID 8)
(NULL, 8, 18, CURDATE(), '07:00:00', '11:30:00', 'available'), -- Schedule ID 37 (Tech 8, Room 18)
(NULL, 8, 18, CURDATE() + INTERVAL 1 DAY, '13:00:00', '16:30:00', 'available'), -- Schedule ID 38 (Tech 8, Room 18)

-- Oncology Lab Technician (Specialty ID 10)
(NULL, 10, 20, CURDATE(), '07:00:00', '11:30:00', 'available'), -- Schedule ID 39 (Tech 10, Room 20)
(NULL, 10, 20, CURDATE() + INTERVAL 2 DAY, '13:00:00', '16:30:00', 'available'); -- Schedule ID 40 (Tech 10, Room 20)


-- Insert sample data into Service table
-- Specialty IDs 1-10 are available
INSERT INTO Service (name, description, price, duration, type, category, specialtyId, status) VALUES
-- Cardiology Services (Specialty ID 1)
('Basic Heart Checkup', 'Basic heart examination including ECG', 500000, 30, 'service', 'Examination', 1, 'active'), -- Service ID 1
('Comprehensive Heart Examination', 'Comprehensive heart examination with stress test', 1500000, 60, 'service', 'Examination', 1, 'active'), -- Service ID 2
('ECG Test', 'Electrocardiogram test', 300000, 15, 'test', 'Diagnostic', 1, 'active'), -- Service ID 3
('Echocardiogram', 'Ultrasound of the heart', 800000, 30, 'test', 'Diagnostic', 1, 'active'), -- Service ID 4

-- Dermatology Services (Specialty ID 2)
('Skin Consultation', 'General skin consultation', 400000, 30, 'service', 'Consultation', 2, 'active'), -- Service ID 5
('Skin Biopsy', 'Removal of a small piece of skin for testing', 600000, 20, 'test', 'Diagnostic', 2, 'active'), -- Service ID 6
('Mole Removal', 'Surgical removal of moles', 1000000, 45, 'service', 'Treatment', 2, 'active'), -- Service ID 7

-- Neurology Services (Specialty ID 3)
('Neurological Consultation', 'Comprehensive neurological examination', 600000, 45, 'service', 'Consultation', 3, 'active'), -- Service ID 8
('EEG Test', 'Electroencephalogram test', 700000, 40, 'test', 'Diagnostic', 3, 'active'), -- Service ID 9
('MRI Brain', 'Magnetic Resonance Imaging of the brain', 2500000, 60, 'test', 'Diagnostic', 3, 'active'), -- Service ID 10

-- Orthopedics Services (Specialty ID 4)
('Orthopedic Consultation', 'General consultation for bone and joint issues', 500000, 30, 'service', 'Consultation', 4, 'active'), -- Service ID 11
('X-Ray', 'X-ray imaging', 400000, 15, 'test', 'Diagnostic', 4, 'active'), -- Service ID 12
('Joint Injection', 'Therapeutic injection into joints', 800000, 20, 'service', 'Treatment', 4, 'active'), -- Service ID 13

-- Pediatrics Services (Specialty ID 5)
('Child Health Checkup', 'General health checkup for children', 400000, 30, 'service', 'Examination', 5, 'active'), -- Service ID 14
('Growth and Development Assessment', 'Assessment of child growth and development', 500000, 40, 'service', 'Assessment', 5, 'active'), -- Service ID 15
('Vaccination', 'Standard childhood vaccination', 300000, 15, 'service', 'Preventive', 5, 'active'), -- Service ID 16

-- Gastroenterology Services (Specialty ID 6)
('Gastroenterology Consultation', 'General consultation for digestive issues', 550000, 30, 'service', 'Consultation', 6, 'active'), -- Service ID 17
('Endoscopy Procedure', 'Upper endoscopy', 1200000, 60, 'procedure', 'Diagnostic', 6, 'active'), -- Service ID 18

-- Ophthalmology Services (Specialty ID 7)
('Eye Exam', 'Comprehensive eye examination', 450000, 30, 'service', 'Examination', 7, 'active'), -- Service ID 19

-- Pulmonology Services (Specialty ID 8)
('Pulmonology Consultation', 'General consultation for respiratory issues', 500000, 30, 'service', 'Consultation', 8, 'active'), -- Service ID 20

-- Endocrinology Services (Specialty ID 9)
('Endocrinology Consultation', 'General consultation for hormone/metabolic issues', 550000, 30, 'service', 'Consultation', 9, 'active'), -- Service ID 21

-- Oncology Services (Specialty ID 10)
('Oncology Consultation', 'General consultation for cancer-related issues', 600000, 45, 'service', 'Consultation', 10, 'active'); -- Service ID 22


-- Insert sample data into File table
INSERT INTO File (fileName, filePath, fileType, fileSize, description) VALUES
('ecg_result_template.pdf', '/uploads/templates/ecg_result.pdf', 'application/pdf', 256000, 'Template for ECG results'), -- File ID 1
('xray_template.jpg', '/uploads/templates/xray.jpg', 'image/jpeg', 1024000, 'Template for X-ray image'), -- File ID 2
('blood_test_template.pdf', '/uploads/templates/blood_test.pdf', 'application/pdf', 180000, 'Template for blood test results'); -- File ID 3

-- Insert sample data into EmailVerification table
INSERT INTO EmailVerification (email, verificationCode, expiresAt, verified) VALUES
('patient1@example.com', '123456', DATE_ADD(NOW(), INTERVAL 1 DAY), true),
('patient2@example.com', '234567', DATE_ADD(NOW(), INTERVAL 1 DAY), true),
('newpatient@example.com', '345678', DATE_ADD(NOW(), INTERVAL 1 DAY), false);

-- Insert sample data into Appointment table
-- Patient IDs 1-50, Doctor IDs 1-20, Schedule IDs 1-40, Specialty IDs 1-10, Room IDs 1-20 are available
-- Mapped original data's patientId/doctorId to the actual AUTO_INCREMENT IDs from previous inserts.
INSERT INTO Appointment (
    patientId,
    doctorId,
    scheduleId,
    specialtyId,
    appointmentDate,
    appointmentTime,
    reason,
    status,
    emailVerified,
    paymentStatus,
    patientAppointmentStatus,
    queueNumber,
    estimatedTime
)
VALUES
-- Cardiology Appointments (Specialty ID 1)
(1, 1, 1, 1, CURDATE() - INTERVAL 7 DAY, '07:30:00', 'Chest pain and shortness of breath', 'completed', TRUE, 'completed', 'examined', 1, '07:30:00'),
(6, 1, 2, 1, CURDATE(), '07:30:00', 'Irregular heartbeat', 'pending', FALSE, 'pending', 'waiting', 2, '07:45:00'),
(11, 2, 4, 1, CURDATE() - INTERVAL 5 DAY, '13:30:00', 'High blood pressure follow-up', 'completed', TRUE, 'completed', 'examined', 3, '13:30:00'),
(16, 2, 5, 1, CURDATE(), '07:30:00', 'Heart palpitations', 'pending', FALSE, 'pending', 'waiting', 4, '07:45:00'),

-- Dermatology Appointments (Specialty ID 2)
(2, 3, 6, 2, CURDATE() - INTERVAL 10 DAY, '07:30:00', 'Persistent rash on arms', 'completed', TRUE, 'completed', 'examined', 1, '07:30:00'),
(7, 3, 7, 2, CURDATE(), '13:30:00', 'Acne treatment follow-up', 'pending', FALSE, 'pending', 'waiting', 2, '13:45:00'),
(12, 4, 8, 2, CURDATE() + INTERVAL 1 DAY, '07:30:00', 'Suspicious mole on back', 'pending', FALSE, 'pending', 'waiting', 3, '07:45:00'),

-- Neurology Appointments (Specialty ID 3)
(3, 5, 9, 3, CURDATE() - INTERVAL 14 DAY, '07:30:00', 'Frequent migraines', 'completed', TRUE, 'completed', 'examined', 1, '07:30:00'),
(8, 5, 10, 3, CURDATE(), '13:30:00', 'Persistent dizziness', 'pending', FALSE, 'pending', 'waiting', 2, '13:45:00'),
(13, 6, 11, 3, CURDATE() + INTERVAL 1 DAY, '07:30:00', 'Numbness in left arm', 'pending', FALSE, 'pending', 'waiting', 3, '07:45:00'),

-- Orthopedics Appointments (Specialty ID 4)
(4, 7, 12, 4, CURDATE() - INTERVAL 21 DAY, '13:30:00', 'Knee pain after running', 'completed', TRUE, 'completed', 'examined', 1, '13:30:00'),
(9, 7, 13, 4, CURDATE(), '07:30:00', 'Back pain evaluation', 'pending', FALSE, 'pending', 'waiting', 2, '07:45:00'),
(14, 8, 14, 4, CURDATE() + INTERVAL 1 DAY, '13:30:00', 'Shoulder mobility issues', 'pending', FALSE, 'pending', 'waiting', 3, '13:45:00'),

-- Pediatrics Appointments (Specialty ID 5)
(41, 9, 15, 5, CURDATE() - INTERVAL 3 DAY, '07:30:00', 'Annual checkup for 6-year-old', 'completed', TRUE, 'completed', 'examined', 1, '07:30:00'),
(42, 9, 16, 5, CURDATE(), '13:30:00', 'Persistent cough in 3-year-old', 'pending', FALSE, 'pending', 'waiting', 2, '13:45:00'),
(43, 10, 17, 5, CURDATE() + INTERVAL 1 DAY, '07:30:00', 'Fever and rash in 8-year-old', 'pending', FALSE, 'pending', 'waiting', 3, '07:45:00'),

-- Gastroenterology Appointments (Specialty ID 6)
(5, 11, 18, 6, CURDATE() - INTERVAL 8 DAY, '13:30:00', 'Persistent heartburn', 'completed', TRUE, 'completed', 'examined', 1, '13:30:00'),
(10, 11, 19, 6, CURDATE(), '07:30:00', 'Abdominal pain evaluation', 'pending', FALSE, 'pending', 'waiting', 2, '07:45:00'),
(15, 12, 20, 6, CURDATE() + INTERVAL 1 DAY, '13:30:00', 'Chronic diarrhea investigation', 'pending', FALSE, 'pending', 'waiting', 3, '13:45:00'),

-- Ophthalmology Appointments (Specialty ID 7)
(20, 13, 21, 7, CURDATE() - INTERVAL 12 DAY, '07:30:00', 'Blurry vision', 'completed', TRUE, 'completed', 'examined', 1, '07:30:00'),
(25, 14, 22, 7, CURDATE(), '13:30:00', 'Eye irritation and redness', 'pending', FALSE, 'pending', 'waiting', 2, '13:45:00'),

-- Pulmonology Appointments (Specialty ID 8)
(30, 15, 23, 8, CURDATE() - INTERVAL 15 DAY, '13:30:00', 'Chronic cough, smoker', 'completed', TRUE, 'completed', 'examined', 1, '13:30:00'),
(35, 16, 24, 8, CURDATE(), '07:30:00', 'Sleep apnea evaluation', 'pending', FALSE, 'pending', 'waiting', 2, '07:45:00'),

-- Endocrinology Appointments (Specialty ID 9)
(40, 17, 25, 9, CURDATE() - INTERVAL 9 DAY, '07:30:00', 'Type 2 diabetes follow-up', 'completed', TRUE, 'completed', 'examined', 1, '07:30:00'),
(45, 18, 26, 9, CURDATE(), '13:30:00', 'Thyroid function check', 'pending', FALSE, 'pending', 'waiting', 2, '13:45:00'),

-- Oncology Appointments (Specialty ID 10)
(50, 19, 27, 10, CURDATE() - INTERVAL 4 DAY, '13:30:00', 'Post-chemotherapy follow-up', 'completed', TRUE, 'completed', 'examined', 1, '13:30:00'),
(21, 20, 28, 10, CURDATE(), '07:30:00', 'Initial consultation for breast lump', 'pending', FALSE, 'pending', 'waiting', 2, '07:45:00');



-- Insert sample data into AppointmentServices table
-- Appointment IDs 1-27, Service IDs 1-22 are available
-- NOTE: Assuming these services were added to the specific appointments listed.
INSERT INTO AppointmentServices (appointmentId, serviceId, price, notes) VALUES
(1, 1, 500000, 'Basic heart checkup requested'), -- ApptService ID 1 (Appt 1, Service 1)
(1, 3, 300000, 'ECG test recommended'), -- ApptService ID 2 (Appt 1, Service 3)
(5, 5, 400000, 'Initial skin consultation'), -- ApptService ID 3 (Appt 5, Service 5)
(8, 8, 600000, 'Neurological consultation for headaches'), -- ApptService ID 4 (Appt 8, Service 8)
(8, 9, 700000, 'EEG test to check for abnormalities'), -- ApptService ID 5 (Appt 8, Service 9)
(11, 11, 500000, 'Assessment of knee injury'), -- ApptService ID 6 (Appt 11, Service 11)
(11, 12, 400000, 'X-ray of knee recommended'), -- ApptService ID 7 (Appt 11, Service 12)
(14, 14, 400000, 'Regular checkup for 6-year-old'); -- ApptService ID 8 (Appt 14, Service 14)


-- Insert sample data into MedicalRecord table
-- Appointment IDs must exist. Linking to completed appointments.
-- Note: Original data linked to appointment IDs 1, 2, 3 which are completed.
INSERT INTO MedicalRecord (appointmentId, diagnosis, notes, recommendations, followupDate) VALUES
(1, 'Mild angina', 'Patient reported chest pain during exertion. ECG was normal at rest.', 'Avoid strenuous activity, prescribed Nitroglycerin as needed. Follow up in 4 weeks.', CURDATE() + INTERVAL 4 WEEK), -- Record ID 1 (for Appointment 1)
(5, 'Contact dermatitis', 'Rash on arms consistent with allergic reaction.', 'Identify and avoid allergen. Apply topical steroid.', CURDATE() + INTERVAL 2 WEEK), -- Record ID 2 (for Appointment 5)
(8, 'Migraine without aura', 'Frequent severe headaches, photo- and phonophobia.', 'Trigger identification, acute treatment with triptan, consider preventative therapy.', CURDATE() + INTERVAL 3 WEEK); -- Record ID 3 (for Appointment 8)


-- Insert sample data into TestRequest table
INSERT INTO TestRequest (appointmentId, serviceId, requestDate, status, notes, requestedByDoctorId) VALUES
-- Requests for completed appointments
(1, 3, CURDATE() - INTERVAL 7 DAY, 'completed', 'Test request for ECG Test', 1), -- Request ID 1 (for Appointment 1, Dr. 1)
(5, 6, CURDATE() - INTERVAL 10 DAY, 'completed', 'Test request for Skin Biopsy', 3), -- Request ID 2 (for Appointment 5, Dr. 3)
(8, 9, CURDATE() - INTERVAL 14 DAY, 'completed', 'Test request for EEG Test', 5), -- Request ID 3 (for Appointment 8, Dr. 5)

-- Pending requests for current appointments
(6, 3, CURDATE(), 'pending', 'Test request for ECG Test', 1), -- Request ID 4 (for Appointment 6, Dr. 1)
(9, 10, CURDATE(), 'pending', 'Test request for MRI Brain', 5), -- Request ID 5 (for Appointment 9, Dr. 5)
(10, 12, CURDATE(), 'pending', 'Test request for X-Ray', 11), -- Request ID 6 (for Appointment 10, Dr. 11)
(16, 4, CURDATE(), 'pending', 'Test request for Echocardiogram', 2); -- Request ID 7 (for Appointment 16, Dr. 2)


-- Insert sample data into TestResult table
-- recordId, serviceId, technicianId, roomId, resultFileId, resultType, status must match existing IDs/enums
-- technicianId refers to technicianId (AUTO_INCREMENT), not userId.
INSERT INTO TestResult (recordId, appointmentId, requestId, serviceId, technicianId, roomId, resultText, resultFileId, resultType, normalRange, unit, interpretation, status, performedDate) VALUES
-- ECG Test Result (for Medical Record 1, related to Appointment 1)
(1, 1, 1, 3, 1, 1, 'Heart rate: 78 bpm, Regular rhythm, Normal QRS complex', 1, 'file', '60-100', 'bpm', 'Normal ECG at rest. Clinical symptoms suggest exertional ischemia.', 'completed', CURDATE() - INTERVAL 7 DAY), -- Result ID 1

-- Skin Biopsy Result (for Medical Record 2, related to Appointment 5)
(2, 5, 2, 6, 2, 5, NULL, 3, 'file', NULL, NULL, 'Histology shows epidermal spongiosis and superficial perivascular inflammation consistent with acute contact dermatitis.', 'completed', CURDATE() - INTERVAL 9 DAY), -- Result ID 2

-- EEG Test Result (for Medical Record 3, related to Appointment 8)
(3, 8, 3, 9, 3, 6, 'Normal brain wave activity', 1, 'file', 'N/A', 'N/A', 'No epileptiform activity or focal slowing detected.', 'completed', CURDATE() - INTERVAL 13 DAY); -- Result ID 3

-- Insert sample data into Medication table
INSERT INTO Medication (name, description, dosage, price, category, manufacturer, sideEffects) VALUES
('Nitroglycerin', 'Vasodilator for angina', '0.4mg sublingual tablet', 75000, 'Cardiovascular', 'Pfizer', 'Headache, dizziness'), -- Medication ID 1
('Hydrocortisone Cream', 'Topical steroid for skin inflammation', '1% cream', 80000, 'Dermatology', 'Johnson & Johnson', 'Skin thinning, local irritation'), -- Medication ID 2
('Sumatriptan', 'Triptan for migraine relief', '50mg tablet', 150000, 'Neurology', 'GlaxoSmithKline', 'Dizziness, nausea, chest tightness'), -- Medication ID 3
('Naproxen', 'NSAID for pain and inflammation', '500mg tablet', 30000, 'Pain Relief', 'Roche', 'Stomach upset, heartburn'), -- Medication ID 4
('Omeprazole', 'Proton pump inhibitor for GERD', '20mg capsule', 45000, 'Gastroenterology', 'Abbott', 'Headache, nausea'), -- Medication ID 5
('Albuterol Inhaler', 'Bronchodilator for asthma', '90mcg/puff inhaler', 250000, 'Pulmonology', 'GlaxoSmithKline', 'Tremor, fast heartbeat'), -- Medication ID 6
('Metformin', 'Oral medication for Type 2 Diabetes', '500mg tablet', 20000, 'Endocrinology', 'Bristol-Myers Squibb', 'Nausea, diarrhea'); -- Medication ID 7


-- Insert sample data into Prescription table
-- recordId must match existing MedicalRecord IDs. doctorId must match existing Doctor IDs.
INSERT INTO Prescription (recordId, doctorId, notes, status) VALUES
(1, 1, 'Patient advised to carry nitroglycerin at all times.', 'active'), -- Prescription ID 1 (for Record 1, Dr 1)
(2, 3, 'Patient should avoid contact with potential allergens and follow up if rash worsens.', 'active'), -- Prescription ID 2 (for Record 2, Dr 3)
(3, 5, 'Migraine trigger diary recommended.', 'active'); -- Prescription ID 3 (for Record 3, Dr 5)


-- Insert sample data into PrescriptionDetail table
-- prescriptionId must match existing Prescription IDs. medicationId must match existing Medication IDs.
INSERT INTO PrescriptionDetail (prescriptionId, medicationId, dosage, frequency, duration, instructions) VALUES
(1, 1, '0.4mg', 'As needed for chest pain', 'Until next visit', 'Place one tablet under the tongue when chest pain occurs. May repeat every 5 minutes for up to 3 doses. If pain persists, seek emergency care.'), -- Prescription 1, Medication 1
(2, 2, 'Thin layer', 'Twice daily', '14 days', 'Apply thinly to affected areas after washing. Avoid sun exposure on treated skin.'), -- Prescription 2, Medication 2
(3, 3, '50mg', 'As needed for migraine', 'As needed (max 9 doses/month)', 'Take one tablet at the first sign of a migraine headache.'); -- Prescription 3, Medication 3


-- Insert sample data into Payment table
-- appointmentId must match existing Appointment IDs.
INSERT INTO Payment (appointmentId, amount, method, status, transactionId, paymentDate) VALUES
(1, 800000, 'credit_card', 'completed', 'TXN123456789', NOW() - INTERVAL 6 DAY), -- Payment ID 1 (for Appointment 1) - Basic Checkup (500k) + ECG (300k) = 800k
(5, 400000, 'bank_transfer', 'completed', 'TXN123456790', NOW() - INTERVAL 9 DAY), -- Payment ID 2 (for Appointment 5) - Skin Consultation (400k)
(8, 1300000, 'credit_card', 'completed', 'TXN123456791', NOW() - INTERVAL 13 DAY); -- Payment ID 3 (for Appointment 8) - Neuro Consultation (600k) + EEG (700k) = 1.3M


-- Display a message to confirm completion
SELECT 'Database FINAL_PROJECT_OOSE created and sample data inserted based on provided schema.' AS Message;