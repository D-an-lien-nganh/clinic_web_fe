export const formatMoney = (value: any) => {
  let val = (value / 1).toFixed(0).replace(".", ",");
  return val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

export function classNames(...classes: any) {
  return classes.filter(Boolean).join(" ");
}

export const capitalizeText = (string: string) =>
  string.replace(/(^\w{1})|(\s+\w{1})/g, (letter) => letter.toUpperCase());

export const formatPhoneNumber = (input: any) => {
  if (!input || isNaN(input)) return;
  if (typeof input !== "string") input = input.toString();
  if (input.length === 10) {
    return input.replace(/(\d{3})(\d{3})(\d{4})/, "$1 $2 $3");
  } else if (input.length < 10) {
    return "was not supplied enough numbers please pass a 10 digit number";
  } else if (input.length > 10) {
    return "was supplied too many numbers please pass a 10 digit number";
  } else {
    return "something went wrong";
  }
};

export const getTotal = (list: any) => {
  return list.reduce((total: any, item: any) => (total += item.quantity), 0);
};

export const shortenName = (firstName: string, lastName: string) => {
  
  const firstNameInitials = firstName.split(" ").map(part => part.charAt(0)).join(".");
  const shortenedName = `${firstNameInitials}.${lastName}`;

  return shortenedName;
};
