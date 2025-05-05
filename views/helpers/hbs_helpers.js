// Kiểm tra file và thêm helpers để hiển thị ngày tháng đúng định dạng cho lịch trực

import moment from 'moment';

// Format a date using moment.js
export function formatDate(date, format = 'MMM DD, YYYY') {
  if (!date) return '';
  try {
    return moment(date).format(format);
  } catch (error) {
    console.error('Error formatting date:', error);
    return '';
  }
}

// Format a date to display day of week
export function formatDay(date) {
  if (!date) return '';
  try {
    return moment(date).format('dddd');
  } catch (error) {
    console.error('Error formatting day:', error);
    return '';
  }
}

// Check if two values are equal
export function eq(a, b) {
  return a === b;
}

// Check if value is less than or equal to compare
export function lte(a, b) {
  return a <= b;
}

// Subtract two numbers
export function subtract(a, b) {
  return a - b;
}

// Logical OR
export function or(a, b) {
  return a || b;
}

// Loop n times
export function times(n, block) {
  let accum = '';
  for (let i = 0; i < n; i++) {
    accum += block.fn(i);
  }
  return accum;
}

// Find an object in an array where property equals value
export function arrayFind(array, property, value) {
  if (!array) return null;
  
  const found = array.find(item => item[property] === value);
  return found || null;
}

// Remove a filter from the current URL
export function removeFilterUrl(paramName) {
  // This is a bit of a hack since handlebars doesn't have access to the request object
  // We'll rebuild the URL client-side in JavaScript
  return `javascript:removeFilter('${paramName}')`;
}

// Các helpers khác nếu đã có 