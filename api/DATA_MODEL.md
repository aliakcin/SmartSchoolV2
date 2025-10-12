# Smart School Data Model

This document describes the MongoDB collections structure based on the SQL schema.

## Collections Overview

### 1. Students
Student personal information

**Fields:**
- `_id`: ObjectId (MongoDB internal)
- `idNumber`: String (Unique student ID number)
- `firstName`: String
- `lastName`: String
- `gender`: Number (0: Female, 1: Male)
- `fatherName`: String (Optional)
- `motherName`: String (Optional)
- `createdAt`: Date

### 2. StudentAcademics
Student academic enrollment information

**Fields:**
- `_id`: ObjectId (MongoDB internal)
- `studentId`: Number (Reference to students.id)
- `smartId`: Number (SmartSchool internal ID)
- `schoolNumber`: Number
- `schoolCode`: String (Reference to schools.schoolCode)
- `classId`: Number
- `departmentKey`: Number (Reference to departments.departmentKey)
- `status`: Number (1: Active, other values for different statuses)
- `createdAt`: Date

### 3. Courses
Course information

**Fields:**
- `_id`: ObjectId (MongoDB internal)
- `courseKey`: Number (Unique course key)
- `schoolCode`: String (Reference to schools.schoolCode)
- `academicPeriod`: String (e.g., "2025-2026")
- `courseId`: Number (Internal course ID)
- `courseExternalId`: String (Optional external ID)
- `courseName`: String
- `courseNameEn`: String (Optional English name)

### 4. Departments
Class/Department information

**Fields:**
- `_id`: ObjectId (MongoDB internal)
- `departmentKey`: Number (Unique department key)
- `schoolCode`: String (Reference to schools.schoolCode)
- `academicPeriod`: String (e.g., "2025-2026")
- `departmentName`: String (e.g., "10A")
- `departmentExternalId`: String (Optional external ID)
- `isActive`: Boolean
- `createdAt`: Date

### 5. StudentCourses
Student grades for courses

**Fields:**
- `_id`: ObjectId (MongoDB internal)
- `studentAcademicId`: Number (Reference to studentAcademics.id)
- `courseKey`: Number (Reference to courses.courseKey)
- `homeWork1`: Number (Optional)
- `midterm1`: Number (Optional)
- `final1`: Number (Optional)
- `homeWork2`: Number (Optional)
- `midterm2`: Number (Optional)
- `final2`: Number (Optional)
- `letterGrade1`: String (Optional)
- `letterGrade2`: String (Optional)
- `effortGrade1`: String (Optional)
- `effortGrade2`: String (Optional)
- `isNumber`: Boolean
- `updatedAtUtc`: Date
- `updatedBy`: String

### 6. UserPersons
User personal information

**Fields:**
- `_id`: ObjectId (MongoDB internal)
- `userId`: Number (Unique user ID)
- `idNumber`: String (Unique ID number)
- `fullName`: String
- `globalLock`: Boolean
- `createdAt`: Date
- `updatedAt`: Date

### 7. UserCredentials
User authentication information

**Fields:**
- `_id`: ObjectId (MongoDB internal)
- `credentialId`: Number (Unique credential ID)
- `userId`: Number (Reference to userPersons.userId)
- `schoolCode`: String (Reference to schools.schoolCode)
- `username`: String (Unique per school)
- `passHash`: String (Hashed password)
- `role`: String ("Staff", "Teacher", "Admin", etc.)
- `isLocked`: Boolean
- `lastLoginAt`: Date (Optional)
- `passwordUpdatedAt`: Date (Optional)
- `createdAt`: Date
- `ascTeacherUid`: String (Optional)
- `smartSchoolId`: Number (Optional)

### 8. InstructorCourseMaps
Mapping of instructors to courses

**Fields:**
- `_id`: ObjectId (MongoDB internal)
- `id`: Number (Unique mapping ID)
- `userId`: Number (Reference to userPersons.userId)
- `courseKey`: Number (Reference to courses.courseKey)
- `isActive`: Boolean
- `createdAt`: Date

### 9. CourseClassMaps
Mapping of courses to classes/departments

**Fields:**
- `_id`: ObjectId (MongoDB internal)
- `id`: Number (Unique mapping ID)
- `courseKey`: Number (Reference to courses.courseKey)
- `departmentKey`: Number (Reference to departments.departmentKey)
- `isActive`: Boolean
- `createdAt`: Date

### 10. PeriodDefs
School period definitions

**Fields:**
- `_id`: ObjectId (MongoDB internal)
- `schoolCode`: String (Reference to schools.schoolCode)
- `academicPeriod`: String (e.g., "2025-2026")
- `periodNo`: Number (Period number)
- `startTime`: String (Format: "HH:MM:SS")
- `endTime`: String (Format: "HH:MM:SS")

### 11. Schools
School information

**Fields:**
- `_id`: ObjectId (MongoDB internal)
- `schoolCode`: String (Unique school code)
- `schoolName`: String

### 12. TimeTables
Timetable information

**Fields:**
- `_id`: ObjectId (MongoDB internal)
- `id`: Number (Unique timetable ID)
- `academicPeriod`: String (e.g., "2025-2026")
- `schoolCode`: String (Reference to schools.schoolCode)
- `teacherUId`: String
- `dayCode`: String (e.g., "MON", "TUE")
- `dayOfWeek`: Number (1-7)
- `periodNo`: Number
- `subjectName`: String
- `classList`: String (Class list)
- `roomShortName`: String

## Relationships

### Core Relationships:
1. **Students** ↔ **StudentAcademics**: One-to-many (one student can have multiple academic records)
2. **StudentAcademics** ↔ **StudentCourses**: One-to-many (one academic record can have multiple course grades)
3. **Courses** ↔ **StudentCourses**: One-to-many (one course can have multiple student grades)
4. **Departments** ↔ **StudentAcademics**: One-to-many (one department can have multiple students)
5. **Courses** ↔ **Departments**: Many-to-many via **CourseClassMaps**
6. **Users** ↔ **Courses**: Many-to-many via **InstructorCourseMaps**
7. **Users** ↔ **UserCredentials**: One-to-one (one user can have one credential per school)
8. **Users** ↔ **UserPersons**: One-to-one (one user has one personal record)
9. **Schools** ↔ **Departments**: One-to-many
10. **Schools** ↔ **Courses**: One-to-many
11. **Schools** ↔ **UserCredentials**: One-to-many
12. **Schools** ↔ **PeriodDefs**: One-to-many
13. **Schools** ↔ **TimeTables**: One-to-many

## Indexes

All collections have appropriate indexes for efficient querying:
- Unique indexes on primary keys
- Compound indexes on frequently queried fields
- Text indexes where appropriate