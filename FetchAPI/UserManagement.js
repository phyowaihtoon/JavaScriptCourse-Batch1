
document.getElementById("btn-load").addEventListener("click", showUsers);
document.getElementById("btn-search").addEventListener("click", searchUser);
document.getElementById("btn-clear").addEventListener("click", clearSearchCriteria);

//Name function to show users in table
//Use for loop to loop through users array and show in table
async function showUsers() {

    document.getElementById("loading").style.display = "block";

    let usersURL = "https://jsonplaceholder.typicode.com/users";

    let response;
    let users;

    try {

        response = await fetch(usersURL); //Send HTTP GET request to usersURL and get response
        users = await response.json(); //Convert response to JSON

        document.getElementById("loading").style.display = "none";
        document.getElementById("error").style.display = "none";

        if (response.status === 404) {
            alert("Invalid URL");
        }

    } catch (error) {
        document.getElementById("loading").style.display = "none";
        document.getElementById("error").style.display = "block";
        document.getElementById("error").innerText = "Faied to connect server. Please, check your connection";
    }

    console.log(response.ok); //Show response ok in console
    console.log(response.status); //Show response status in console

    let tableBody = document.getElementById("table-body");

    tableBody.innerHTML = ""; //Clear table body before showing users

    users.forEach(user => {
        let row = `<tr>
                    <td>${user.id}</td>
                    <td>${user.name}</td>
                    <td>${user.email}</td>
                    <td>${user.phone}</td>
                    <td>${user.website}</td>
                </tr>`;

        tableBody.innerHTML = tableBody.innerHTML + row;
    });

}


//Search User
async function searchUser() {

    let url="https://jsonplaceholder.typicode.com/users";

    document.getElementById("loading").style.display = "block";

    let userName = document.getElementById("search-name").value;
    let userEmail = document.getElementById("search-email").value;

    if (userName === "" && userEmail !== "") {
         url = "https://jsonplaceholder.typicode.com/users?email=" + userEmail;
    }

    if(userName !== "" && userEmail ===""){
        url = "https://jsonplaceholder.typicode.com/users?name=" + userName;
    }

    if(userName !=="" && userEmail !==""){
        url = "https://jsonplaceholder.typicode.com/users?name=" + userName+"&email="+userEmail;
    }

    let tableBody = document.getElementById("table-body");
    tableBody.innerHTML = "";

    try {
        let res = await fetch(url)
        let users = await res.json();
        document.getElementById("loading").style.display = "none";
        document.getElementById("error").style.display = "none";

        users.forEach(user => {
            let row = `
                <tr>
                    <td>${user.id}</td>
                    <td>${user.name}</td>
                    <td>${user.email}</td>
                    <td>${user.phone}</td>
                    <td>${user.website}</td>
                </tr>
                `;

            tableBody.innerHTML += row;
        });

    } catch (error) {
        document.getElementById("loading").style.display = "none";
        document.getElementById("error").style.display = "block";
        document.getElementById("error").innerText = "Faied to connect server. Please, check your connection";
    }



}


function clearSearchCriteria(){
    document.getElementById("search-name").value = "";
    document.getElementById("search-email").value = "";
}
