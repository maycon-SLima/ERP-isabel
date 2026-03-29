import { checkAuth } from './protected.js';

const user = await checkAuth();

document.getElementById('userName').textContent = user.displayName || user.email;
document.getElementById('userEmail').textContent = user.email;