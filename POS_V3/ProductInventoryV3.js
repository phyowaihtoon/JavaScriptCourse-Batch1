let productId = 1;

let products = []; //length = 0


document.getElementById("btn-add").addEventListener("click", addProduct);
document.getElementById("btn-clear").addEventListener("click", clearProduct);


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

    products[products.length] = product;

    productId++;

    showProducts(); //function call to show products in table
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
                    <td>${product.name}</td>
                    <td>${product.sellingPrice}</td>
                    <td>${product.quantity} </td>
                    <td class="action-column">
                        <button class="btn-edit">Edit</button>
                        <button class="btn-delete">Delete</button>
                    </td>
                </tr>`;

        tableBody.innerHTML += row;
    }

}

//Implement a function to delete product from products array and show in table
function deleteProduct(productId) {

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