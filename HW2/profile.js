
document.getElementById("updateBtn").addEventListener("click", () =>{
    const fields = ["displayName", "email", "phone", "zipcode", "password"];
    let updated = [];
    let inValid = [];

    const passwordInput = document.getElementById("passwordInput").value;
    const passwordConfirmInput = document.getElementById("passwordConfirmInput").value;
    fields.forEach(field =>{
        const span = document.getElementById(field);
        const input = document.getElementById(field+"Input");
        if(input && input.value.trim() !==""){
            if(field ==="zipcode" && !/^\d{5}$/.test(input.value)){
                inValid.push("Invalid zipcode");
            }else if(field === "phone" && !/^\d{3}-\d{3}-\d{4}$/.test(input.value)){
                inValid.push("Invalid phone number");
            }else if(field === "email" && !/.+@.+\..+/.test(input.value)){
                inValid.push("Invalid email");
            }else if(field === "password" ){
                if(passwordInput === passwordConfirmInput){
                    span.textContent = "*".repeat(passwordConfirmInput.length);
                    updated.push("Password Updated!");
                }else{
                    inValid.push("Password do not match Confirm Password.");
                }
                    
            }else{
                span.textContent = input.value;
                updated.push(field);
            }   
            input.value = ""; /*清空*/             
        }
    });

    const messageDiv = document.getElementById("updateMsg");
    if(inValid.length > 0){/*有不合法Input update*/
        messageDiv.textContent = inValid.join(", ");
        messageDiv.className = "update invalid";

    }else if(updated.length >0){
        messageDiv.textContent = "Updated: "+updated.join(", ");
        messageDiv.className = "update success";
    }else{
        messageDiv.textContent = "No update made.";
        messageDiv.className = "updateMsg";
    }
});
    