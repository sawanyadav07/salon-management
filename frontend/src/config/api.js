import axios from 'axios';

const normalizeUrl = (url = '') => url.trim().replace(/\/+$/, '');

const apiBaseURL = normalizeUrl(process.env.REACT_APP_API_URL || '');

if (apiBaseURL) {
  axios.defaults.baseURL = apiBaseURL;
}

const explicitSocketUrl = normalizeUrl(process.env.REACT_APP_SOCKET_URL || '');

export const socketURL = explicitSocketUrl || apiBaseURL || 'http://localhost:5000';

export default axios;
