
document.getElementById("btn-load").addEventListener("click", showUsers);

//Name function to show users in table
//Use for loop to loop through users array and show in table
async function showUsers() {

    let usersURL = "https://jsonplaceholder.typicode.com/users";

    let response = await fetch(usersURL); //Send HTTP GET request to usersURL and get response
    let users = await response.json(); //Convert response to JSON

    console.log(response.status); //Show response status in console

    let tableBody = document.getElementById("table-body");

    tableBody.innerHTML = ""; //Clear table body before showing users

    users.forEach( user => {
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
