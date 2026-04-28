
let users = [];

document.getElementById("btn-create-post").addEventListener("click", createPost);
document.getElementById("btn-clear-post").addEventListener("click", clearPost);


//Function Declaration
async function loadPosts() {

    let postsURL = "https://jsonplaceholder.typicode.com/posts";

    const res = await fetch(postsURL);
    const posts = await res.json();

    let postContainerUI = document.getElementById("post-container");
    postContainerUI.innerHTML = "";

    posts.forEach(post => {

        let user = users.find(user => user.id === post.userId);

        let postUI = `<div class="post">
            <div>${user?.name}</div>
            <h3>${post.title}</h3>
            <p>${post.body}</p>
        </div>`;

        postContainerUI.innerHTML += postUI;

    });

    console.log("Loading posts done.");

}

async function loadUsers() {

    let usersURL = "https://jsonplaceholder.typicode.com/users";

    const res = await fetch(usersURL);
    users = await res.json();

    console.log("Loading users done.");

}

//Function Call on form load
console.log("Loading users starts.");
loadUsers();
console.log("Loading posts starts.");
loadPosts();

async function createPost() {

    let postTitle = document.getElementById("post-title").value;
    let postBody = document.getElementById("post-body").value;

    let postData = {
        title: postTitle,
        body: postBody,
        userId: 1
    };

    let postURL = "https://jsonplaceholder.typicode.com/posts";

    let options = {
        method: 'POST',
        body: JSON.stringify(postData),
        headers: {
            'Content-type': 'application/json; charset=UTF-8',
        },
    };

    const res = await fetch(postURL, options);
    const postedData = await res.json();

    if (res.ok) {
        document.getElementById("message").style.display ="block";
        document.getElementById("message").innerText = "Your post has been successfully uploaded.";
    }

}

function clearPost(){
    document.getElementById("post-title").value ="";
    document.getElementById("post-body").value ="";
    document.getElementById("message").style.display ="none";
}


