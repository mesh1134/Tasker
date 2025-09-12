# Tasker - A Full-Stack To-Do List Application

A clean and simple to-do list application built with Node.js, Express, and MongoDB. This project demonstrates fundamental full-stack web development principles, including user authentication, session management, and RESTful API design.

**Live Demo:** [Link to your deployed application]

## 📸 Application Preview

![GIF of your application in action](link_to_your_gif.gif)

## ✨ Features

* **User Authentication:** Secure user registration and login system. Passwords are encrypted using `bcrypt`.
* **Session Management:** Persistent login sessions are managed using `express-session` and `connect-mongo`.
* **Full CRUD Functionality:** Users can Create, Read, Update, and Delete their own tasks.
* **Task Lists:** Separate views for pending and completed tasks.
* **Responsive Design:** A clean, mobile-friendly user interface.

## 🛠️ Tech Stack

* **Frontend:** HTML5, CSS3, Vanilla JavaScript
* **Backend:** Node.js, Express.js
* **Database:** MongoDB with Mongoose (ODM)
* **Authentication & Sessions:** bcrypt, express-session, connect-mongo
* **Environment Variables:** dotenv

## 🚀 Getting Started

To run this project locally, follow these steps:

1.  **Clone the repository**
    ```sh
    git clone [https://github.com/mesh1134/Tasker.git](https://github.com/mesh1134/Tasker.git)
    ```
2.  **Navigate to the project directory**
    ```sh
    cd Tasker
    ```
3.  **Install NPM packages**
    ```sh
    npm install
    ```
4.  **Set up your environment variables**
    Create a file named `.env` in the root of the project and add the following, replacing the placeholders with your own values:
    ```
    URI=your_mongodb_connection_string
    SESSION_SECRET=a_long_random_secret_string
    ```
5.  **Run the application**
    ```sh
    node index.js
    ```

## 🧠 Key Learnings

This project was a great opportunity to learn and apply core web development concepts:

* **RESTful API Design:** Building a structured and logical backend API to handle client requests.
* **Database Management:** Interacting with a NoSQL database (MongoDB) using an ODM (Mongoose) to perform CRUD operations.
* **Authentication & Security:** Understanding the importance of password hashing (`bcrypt`) and secure session management to protect user data.
* **Full-Stack Integration:** Connecting a frontend client to a backend server, managing data flow, and handling user interactions from end to end.

## 📈 Future Enhancements

I plan to continue improving this application with features like:

* [ ] Task prioritization (e.g., high, medium, low).
* [ ] Due date reminders or notifications.
* [ ] Migrating the frontend to a modern framework like React or Vue.js.
* [ ] Implementing a proper testing suite with a framework like Jest.
