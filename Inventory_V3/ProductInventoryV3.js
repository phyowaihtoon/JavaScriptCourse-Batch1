let productId = 1;

let products = []; //length = 0

document.getElementById("btn-add").addEventListener("click", addProduct);
document.getElementById("btn-clear").addEventListener("click", clearProduct);
document.getElementById("btn-update").addEventListener("click", updateProduct);


function addProduct() {
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
        id: productId,
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
        return;
    }

    products[products.length] = product; // Add product object to products array

    productId++;

    showProducts(); //function call to show products in table

    clearProduct();
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

    for (let i = 0; i < products.length; i++) {
        let product = products[i];
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

    let index = -1; // to store index of an array

    //Find the index of search product 
    for (let i = 0; i < products.length; i++) {
        let productObj = products[i];

        if (productObj.id === productId) {
            index = i;
            break;
        }
    }

    //Shift Elements
    for (let i = index; i < products.length - 1; i++) {
        products[i] = products[i + 1];
    }

    products.length--;

    //Show Products
    showProducts();
}

function editProduct(productId) {

    //1. Find product to edit , and show data in UI
    for (let i = 0; i < products.length; i++) {
        let productObj = products[i]; //Retrieve product object from array

        if (productObj.id === productId) {
            //Show data in UI
            document.getElementById("product-id").value = productObj.id;
            document.getElementById("product-code").value = productObj.code;
            document.getElementById("product-barcode").value = productObj.barcode;
            document.getElementById("product-name").value = productObj.name;
            document.getElementById("category").value = productObj.categoryId;
            document.getElementById("supplier").value = productObj.supplier;
            document.getElementById("expiry-date").value = productObj.expiryDate;
            document.getElementById("status").selectedIndex = productObj.status;
            document.getElementById("cost-price").value = productObj.costPrice;
            document.getElementById("selling-price").value = productObj.sellingPrice;
            document.getElementById("quantity").value = productObj.quantity;
            document.getElementById("unit-of-measure").value = productObj.unitOfMeasure;

            break;
        }
    }


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
    let product = {
        id: updatedProductID,
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

    //4. Update into array
    for (let i = 0; i < products.length; i++) {
        let productObj = products[i];

        if (productObj.id === Number(product.id)) {
            products[i] = product;
            break;
        }
    }


    showProducts();
}

function clearProduct() {
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
}