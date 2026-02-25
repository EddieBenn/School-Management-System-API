# School Management API

## System Architecture

This API is built using the provided Axion template. It features a microservice-ready backend setup leveraging Express, Redis, and Qantra-Pineapple for schema validations. It runs two independent HTTP servers for Users and Admins.

### Database Persistence (Oyster DB over Redis)

Data is structurally pushed via Oyster DB (`managers.oyster.call('...')`), which acts as an ODM over Redis.

- Users, Schools, Classrooms, Students are stored as hash blocks with specific labels (`user`, `school`, `classroom`, `student`).
- We're utilizing Redisearch attributes (`search_index` inside `init.js`) to establish the indices for fast lookups.

---

## 🚀 Postman Endpoints Guide

The system binds to two ports:

- **User Server**: `http://localhost:5111`
- **Admin Server**: `http://localhost:5222`

**Authentication Header Note**:
Once you login, copy the returned `longToken` and insert it as a header key uniquely named `token` for any protected endpoint.

### 👤 User Module (Port 5111 & 5222)

_Base Endpoint: `http://localhost:5111/api/user` OR `http://localhost:5222/api/user`_

**1. Create User / Register**

- **Method & URL**: `POST /createUser`
- **Auth Required**: none
- **Body**:

```json
{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "mypassword123",
  "role": "superadmin" // Can be: superadmin, school_admin, student
}
```

**2. Login**

- **Method & URL**: `POST /login`
- **Auth Required**: none
- **Body**:

```json
{
  "email": "john@example.com",
  "password": "mypassword123"
}
```

**3. Get Current User**

- **Method & URL**: `GET /getUser`
- **Headers**: `token: <your_long_token>`
- **Auth Required**: Authenticated

---

### 🏫 School Module (Port 5222 Only)

_Base Endpoint: `http://localhost:5222/api/school`_
_Auth Required: `token` header. Roles allowed: **Superadmin**._

**1. Create School**

- **Method & URL**: `POST /createSchool`
- **Body**:

```json
{
  "name": "Springfield High",
  "address": "123 Spring Rd"
}
```

**2. Get All Schools**

- **Method & URL**: `GET /getSchools`

**3. Update School**

- **Method & URL**: `PUT /updateSchool`
- **Body**:

```json
{
  "schoolId": "<school_id_string>",
  "name": "Springfield Academy"
}
```

**4. Delete School**

- **Method & URL**: `DELETE /deleteSchool`
- **Body**:

```json
{
  "schoolId": "<school_id_string>"
}
```

---

### 📚 Classroom Module (Port 5222 Only)

_Base Endpoint: `http://localhost:5222/api/classroom`_
_Auth Required: `token` header. Roles allowed: **Superadmin, School Admin**._

**1. Create Classroom**

- **Method & URL**: `POST /createClassroom`
- **Body**:

```json
{
  "name": "Math 101",
  "capacity": "30",
  "schoolId": "<school_id_string>" // Optional if logged in as School Admin
}
```

**2. Get Classrooms**

- **Method & URL**: `GET /getClassrooms`

**3. Update Classroom**

- **Method & URL**: `PUT /updateClassroom`
- **Body**:

```json
{
  "classroomId": "<classroom_id_string>",
  "capacity": "35"
}
```

**4. Delete Classroom**

- **Method & URL**: `DELETE /deleteClassroom`
- **Body**:

```json
{
  "classroomId": "<classroom_id_string>"
}
```

---

### 🧑‍🎓 Student Module (Port 5222 Only)

_Base Endpoint: `http://localhost:5222/api/student`_
_Auth Required: `token` header. Roles allowed: **Superadmin, School Admin**._

**1. Create Student**

- **Method & URL**: `POST /createStudent`
- **Body**:

```json
{
  "firstName": "Bart",
  "lastName": "Simpson",
  "schoolId": "<school_id_string>", // Optional if School Admin
  "classroomId": "<classroom_id_string>" // Optional
}
```

**2. Get Students**

- **Method & URL**: `GET /getStudents`

**3. Update Student**

- **Method & URL**: `PUT /updateStudent`
- **Body**:

```json
{
  "studentId": "<student_id_string>",
  "firstName": "Bartholomew"
}
```

**4. Delete Student**

- **Method & URL**: `DELETE /deleteStudent`
- **Body**:

```json
{
  "studentId": "<student_id_string>"
}
```

---

## Deployment Instructions (Render)

1. **Repository Setup**: Create a public/private Github repository and commit all local files to `main`.
2. **Dashboard Config**: Access Render.com, create a **Web Service**.
3. **Connect Repository**, select Node as your environment.
4. **Environment Variables**: Head into the 'Environment' subtab of Render and paste every key strictly sourced from the `.env` file. Take special diligence defining CORS whitelist origins in `ALLOWED_ORIGINS`.
5. Run Command should be: `npm run dev` (or `node index.js`).
