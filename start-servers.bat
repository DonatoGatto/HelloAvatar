@echo off
echo Paleidžiamas HelloAvatar...
start "Backend :4000" cmd /k "cd /d c:\Users\donat\Desktop\HelloAvatar\backend && npm run start:dev"
timeout /t 3 /nobreak >nul
start "Frontend :3000" cmd /k "cd /d c:\Users\donat\Desktop\HelloAvatar\frontend && npx next dev --port 3000"
echo Abu serveriai paleisti!
