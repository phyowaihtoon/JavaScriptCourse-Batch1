
//Prepare five product objects and add to products array
let products = [];

//Supabase API URL
let supabaseAPIUrl = "https://qipnpkvefevwaalbdsiw.supabase.co/";
let supabaseAPIKey = "sb_publishable_dN6u7xM2mpZfwRuo-q8U-A_dXqsXCO0";
let resourcePath = "rest/v1/product";


async function fetchProducts(){

  let response = await fetch(supabaseAPIUrl + resourcePath, {
        method: "GET",
        headers : {
           'apikey' :  supabaseAPIKey,
           'Accept-Profile' : "inventory"
        }
   }); 

   products = await response.json();

   showProducts(); //function call to show products in table
}

fetchProducts(); 


let autoIncreaseProductId = 6;

document.getElementById("btn-add").addEventListener("click", addProduct );
document.getElementById("btn-clear").addEventListener("click", clearForm );
document.getElementById("btn-update").addEventListener("click", updateProduct );


function addProduct() {
    let productId = document.getElementById("product-id").value;

    if (productId !== "") {
        return;
    }

    let productCode = document.getElementById("product-code").value;
    let barcode = document.getElementById("product-barcode").value;
    let productName = document.getElementById("product-name").value;

    let categoryId = document.getElementById("category").value;// 1,2,3,4,5,6
    let supplier = document.getElementById("supplier").value;
    let expiryDate = document.getElementById("expiry-date").value;
    let status = document.getElementById("status").value;

    let costPrice = document.getElementById("cost-price").value;
    let sellingPrice = document.getElementById("selling-price").value;

    let quantity = document.getElementById("quantity").value;
    let unitOfMeasure = document.getElementById("unit-of-measure").value;


    //Add variables to product object
    let product = {
        id: autoIncreaseProductId,
        code: productCode,
        barcode: barcode,
        name: productName,
        categoryId: categoryId,
        supplier: supplier,
        expiryDate: expiryDate,
        status: status,
        costPrice: costPrice,
        sellingPrice: sellingPrice,
        quantity: quantity,
        unitOfMeasure: unitOfMeasure
    };

    let validationResult = validateProduct(product); // {}

    if (!validationResult.valid) {
        alert(validationResult.message);
        return; //Exit from program
    }


    products.push(product); //Add product object to products array

    autoIncreaseProductId++;

    showProducts(); //function call to show products in table

    clearForm();
}

function validateProduct(product) {
    let result = {
        valid: true,
        message: ""
    };


    if (product.code === "") {
        result.valid = false;
        result.message = "Product Code is required";

        return result;
    }

    if (product.barcode === "") {
        result.valid = false;
        result.message = "Product Barcode is required";

        return result;
    }

    if (product.name === "") {
        result.valid = false;
        result.message = "Product Name is required";

        return result;
    }

    if (product.costPrice === "") {
        result.valid = false;
        result.message = "Cost Price is required";

        return result;
    }

    if (isNaN(product.costPrice)) {
        result.valid = false;
        result.message = "Cost Price must be number";

        return result;
    }


    return result;
}

//Name function to show products in table
//Use for loop to loop through products array and show in table
function showProducts() {

    let tableBody = document.getElementById("table-body");

    tableBody.innerHTML = ""; //Clear table body before showing products

    for (let product of products) {

        //Use data-id attribute to store product id in delete button
        let row = `<tr>
                    <td>${product.id}</td>
                    <td>${product.code}</td>
                    <td>${product.barcode}</td>
                    <td>${product.name}</td>
                    <td>${product.costPrice}</td>
                    <td>${product.sellingPrice}</td>
                    <td>${product.quantity} </td>
                    <td class="action-column">
                        <button class="btn-edit" onclick="editProduct(${product.id})">Edit</button>
                        <button class="btn-delete" onclick="deleteProduct(${product.id})">Delete</button>
                    </td>
                </tr>`;

        tableBody.innerHTML += row;
    }

}

//Implement a function to delete product from products array and show in table
function deleteProduct(productId) {

    let confirmDelete = confirm("Are you sure to delete this product?");

    if (confirmDelete) {
        //Find index of product to delete
        let index = products.findIndex(p => p.id === productId);

        //Remove product from products array
        products.splice(index, 1);

        //Reload products in table
        showProducts();
    }

    
}



function editProduct(productId) {

    //1. Find product to edit 
    let product = products.find(p => p.id === productId);

    //Show data in UI
    document.getElementById("product-id").value = product.id;
    document.getElementById("product-code").value = product.code;
    document.getElementById("product-barcode").value = product.barcode;
    document.getElementById("product-name").value = product.name;
    document.getElementById("category").value = product.categoryId;
    document.getElementById("supplier").value = product.supplier;
    document.getElementById("expiry-date").value = product.expiryDate;
    document.getElementById("status").selectedIndex = product.status;
    document.getElementById("cost-price").value = product.costPrice;
    document.getElementById("selling-price").value = product.sellingPrice;
    document.getElementById("quantity").value = product.quantity;
    document.getElementById("unit-of-measure").value = product.unitOfMeasure;

    //disable add button and enable update button
    document.getElementById("btn-add").disabled = true; //disable add button
    document.getElementById("btn-add").classList.add("btn-disable");

    document.getElementById("btn-update").disabled = false; //enable update button
    document.getElementById("btn-update").classList.remove("btn-disable");
}


function updateProduct() {
    let updatedProductID = document.getElementById("product-id").value;
    let productCode = document.getElementById("product-code").value;
    let barcode = document.getElementById("product-barcode").value;
    let productName = document.getElementById("product-name").value;

    let categoryId = document.getElementById("category").value; // 1,2,3,4,5,6
    let supplier = document.getElementById("supplier").value;
    let expiryDate = document.getElementById("expiry-date").value;
    let status = document.getElementById("status").value;

    let costPrice = document.getElementById("cost-price").value;
    let sellingPrice = document.getElementById("selling-price").value;

    let quantity = document.getElementById("quantity").value;
    let unitOfMeasure = document.getElementById("unit-of-measure").value;


    //Add variables to product object
    let updatedProduct = {
        id: Number(updatedProductID),
        code: productCode,
        barcode: barcode,
        name: productName,
        categoryId: categoryId,
        supplier: supplier,
        expiryDate: expiryDate,
        status: status,
        costPrice: costPrice,
        sellingPrice: sellingPrice,
        quantity: quantity,
        unitOfMeasure: unitOfMeasure
    };

    let productIndex = products.findIndex(p => p.id === updatedProduct.id);

    products[productIndex] = updatedProduct;

    showProducts();
}

function clearForm() {
    document.getElementById("product-id").value = "";
    document.getElementById("product-code").value = "";
    document.getElementById("product-barcode").value = "";
    document.getElementById("product-name").value = "";
    document.getElementById("category").selectedIndex = 0; //Select first option
    document.getElementById("supplier").value = "";
    document.getElementById("expiry-date").value = "";
    document.getElementById("status").selectedIndex = 0; //Select first option
    document.getElementById("cost-price").value = "";
    document.getElementById("selling-price").value = "";
    document.getElementById("quantity").value = "";
    document.getElementById("unit-of-measure").value = "Piece";

    //enable add button and disable update button
    document.getElementById("btn-add").disabled = false;
    document.getElementById("btn-add").classList.remove("btn-disable");

    document.getElementById("btn-update").disabled = true;
    document.getElementById("btn-update").classList.add("btn-disable");
}