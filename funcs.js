function fillWithZero(str, len){
    var countstr = str.toString();
    return "0".repeat(len - countstr.length)+str;
}

function sum(a,b){
    return (a+b)
}

function neq(arg1, arg2, options) {
    return (arg1 != arg2) ? true : false;
}

function eq(arg1, arg2, options) {
    return (arg1 == arg2) ? true : false;
}

function prettydatetime(datetime) {
    if(datetime){
        const my_date = new Date(datetime)
        return my_date.getDate() + "/" + (my_date.getMonth() + 1) + "-" + my_date.getFullYear() + " " + my_date.getHours() + ":" + fillWithZero(my_date.getMinutes(), 2) + ":" + fillWithZero(my_date.getSeconds(), 2);
    }else{
        return;
    }
}

function gt(arg1, arg2, options) {
    return (arg1 > arg2) ? true : false;
}

function lt(arg1, arg2, options) {
    return (arg1 < arg2) ? true : false;
}

function count(arr){
    if(arr){
        return arr.length;
    }else{
        return null;
    }
}

module.exports = { sum, neq, eq, prettydatetime, gt, lt, count, fillWithZero }