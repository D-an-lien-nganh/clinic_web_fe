export const formatDate = (value: string) => {
  if (!value) return "";
  const date = new Date(value);
  if (!date) return "";

  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  const day = date.getDate();
  const month = months[date.getMonth()];
  return day + " " + month;
};


// format date -> VD: 1 ngày trước, 1 tháng trước,......
export const timeAgo = (value: string) => {
  if (!value) return "";

  const date = new Date(value);
  const now = new Date();
  const seconds = Math.round((now.getTime() - date.getTime()) / 1000);
  const minutes = Math.round(seconds / 60);
  const hours = Math.round(minutes / 60);
  const days = Math.round(hours / 24);
  const months = Math.round(days / 30.4);
  const years = Math.round(months / 12);

  if (seconds < 60) {
    return 'just now';
  } else if (minutes === 1) {
    return 'a minute ago';
  } else if (minutes < 60) {
    return `${minutes} minutes ago`;
  } else if (hours === 1) {
    return 'an hour ago';
  } else if (hours < 24) {
    return `${hours} hours ago`;
  } else if (days === 1) {
    return 'a day ago';
  } else if (days < 30) {
    return `${days} days ago`;
  } else if (months === 1) {
    return 'a month ago';
  } else if (months < 12) {
    return `${months} months ago`;
  } else if (years === 1) {
    return 'a year ago';
  } else {
    return `${years} years ago`;
  }
}
