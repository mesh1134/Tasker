const apiUrl = "http://localhost:3000/tasks";
const apiURLCompleted = apiUrl + "/completed";

const taskList = document.getElementById("To-Dos_List");
const addTaskBtn = document.getElementById("NewTaskBtn");
const completedList = document.getElementById("Completed_List");

const hamburger = document.querySelector(".hamburger");
const navLinks = document.querySelector(".nav_links");

//toggling the Navigation Links
hamburger.addEventListener("click", () => {
    navLinks.classList.toggle("active");
})

// Add task button functionality
addTaskBtn.addEventListener("click", () => {
    taskList.appendChild(createTaskInputForm({}, async (newTaskName, newTaskDeadline)=>{
        await addTask(newTaskName, newTaskDeadline);
    }));
});

// Reusable function for API requests
async function apiRequest(url, method="GET", data=null) {
    try {
        const options = {method, headers:{"Content-Type": "application/json"}};
        if (data) options.body = JSON.stringify(data);

        const response = await fetch(url, options);

        if (response.status === 204) return null;
        return response.json();

    } catch (error) {
        console.error(`Failed to ${method} data`, error);
        return null;
    }
}

// Fetch and display tasks
async function fetchTasks(url=apiUrl) {
    const tasks = await apiRequest(url);
    if (!tasks) {
        return;
    }
    if(url===apiUrl){
        taskList.innerHTML = tasks.map(task => createTaskHTML(task)).join("");
    }else{
        completedList.innerHTML = tasks.map(task => createTaskHTML(task, true)).join("");
    }
}

// Create task list item HTML
function createTaskHTML(task, isCompleted = false) {
    return `
        <li>
           ${!isCompleted ? `<button name="complete_btn" class="add_btn" 
            onclick="completeTask(this,'${task._id}','${task.Name}','${task.Deadline}')"> 
               <i class="fa-regular fa-circle-check fa-xl"></i></button>`:''}
           To-Do:<span class="task_detail"><b>${task.Name}</b></span><br> 
            By <span class="task_detail"><b>${formatDeadline(task.Deadline)}</b></span><br>
            <button class="delete_btn" onclick="deleteTask('${task._id}', ${isCompleted})">
                <i class="fa-solid fa-trash-can fa-lg"></i> Delete</button>
            ${!isCompleted ? `<button class="edit_btn" onclick="editTask(this, '${task._id}')">
            <i class="fa-solid fa-pen"></i> Edit</button>` : ''}
        </li>`;
}

// Format deadline for display
function formatDeadline(deadline) {
    return deadline ? new Date(deadline).toLocaleString("en-GB") : "No deadline";
}

// Add new task
async function addTask(newTaskName, newTaskDeadline) {
    if (!newTaskName || !newTaskDeadline) return;

    const newTask = await apiRequest(apiUrl, "POST", { Name: newTaskName, Deadline: newTaskDeadline });
    if (newTask) await fetchTasks();
}

// delete a task
async function deleteTask(id, completed = false) {
    const url = completed ? `${apiURLCompleted}/${id}` : `${apiUrl}/${id}`;
    console.log(`Attempting to delete: ${url}`);

    try {
        // Use the apiRequest helper function for consistency
        const result = await apiRequest(url, "DELETE");

        // If deletion was successful (result is null due to 204 status)
        if (result === null) {
            console.log(`Deleted task ${id} successfully`);
            // Refresh the appropriate list
            if (completed) {
                await fetchTasks(apiURLCompleted);
            } else {
                await fetchTasks(apiUrl);
            }
        } else {
            console.error(`Failed to delete task with ID: ${id}`);
        }
    } catch (error) {
        console.error(`Error deleting task: ${error}`);
    }
}

//marking a task as completed
async function completeTask(button, id, TaskName, TaskDeadline) {
    let listItem = button.parentElement;

    taskList.removeChild(listItem);
    completedList.appendChild(listItem);
    await deleteTask(id); // Remove from active tasks

    // Add the task to the completed collection in the database
    const newTask = await apiRequest(apiURLCompleted, "POST", {
        _id: id,  // Include the original task ID
        Name: TaskName,
        Deadline: TaskDeadline
    });

    console.log("New completed task:", newTask); // Debugging

    if (newTask && newTask._id) {
        // Ensure delete button uses the correct completed task ID
        let deleteBtn = listItem.querySelector(".delete_btn");
        deleteBtn.setAttribute("onclick", `deleteTask('${newTask._id}', true)`);


        await fetchTasks(apiUrl); // Refresh active tasks list
    }

    await fetchTasks(apiURLCompleted); // Refresh completed tasks list
}

// Creating task inputs for when a task needs to be added or edited
function createTaskInputForm(existingTask, onConfirm) {
    let parentElement = document.createElement("div");
    parentElement.className = "newTaskForm";

    let nameInput = document.createElement("input");
    nameInput.type = "text";
    nameInput.placeholder = "To-Do name";
    nameInput.value = existingTask?.Name || "";
    parentElement.appendChild(nameInput);

    let deadlineInput = document.createElement("input");
    deadlineInput.type = "datetime-local";
    deadlineInput.placeholder = "To-Do deadline";

    if (existingTask?.Deadline && !Number.isNaN(new Date(existingTask.Deadline))) {
        deadlineInput.value = new Date(existingTask.Deadline).toISOString().slice(0, -8);
    } else {
        deadlineInput.value = "";
    }
    parentElement.appendChild(deadlineInput);

    let confirmBtn = document.createElement("button");
    confirmBtn.textContent = "Confirm";
    confirmBtn.className = "add_btn";
    confirmBtn.onclick = () => onConfirm(nameInput.value, deadlineInput.value);
    parentElement.appendChild(confirmBtn);

    let cancelBtn = document.createElement("button");
    cancelBtn.insertAdjacentHTML("afterbegin","<svg xmlns=\"http://www.w3.org/2000/svg\" height=\"24px\" viewBox=\"0 -960 960 960\" width=\"24px\" fill=\"#000000\"><path d=\"M200-200h57l391-391-57-57-391 391v57Zm-80 80v-170l528-527q12-11 26.5-17t30.5-6q16 0 31 6t26 18l55 56q12 11 17.5 26t5.5 30q0 16-5.5 30.5T817-647L290-120H120Zm640-584-56-56 56 56Zm-141 85-28-29 57 57-29-28Z\"/></svg>");
    cancelBtn.textContent = "Cancel";
    cancelBtn.className = "delete_btn";
    cancelBtn.onclick = () => parentElement.remove();
    parentElement.appendChild(cancelBtn);

    return parentElement;
}

//Edit task
async function editTask(button, id) {
    const parentElement = button.parentElement;
    parentElement.appendChild(createTaskInputForm({ Name: "", Deadline: "" },async(newName, newDeadline)=>{
        if (await apiRequest(`${apiUrl}/${id}`, "PUT", { Name: newName, Deadline: newDeadline })) {
            await fetchTasks();
        }
    }));
}



// First fetch of tasks when the page loads
fetchTasks();
fetchTasks(apiURLCompleted);

// Showing default message if no tasks exist
if (taskList.childElementCount === 0){
    taskList.insertAdjacentHTML("afterbegin","Start with your first <span>To-Do</span> with the button below!<br><br>");
}