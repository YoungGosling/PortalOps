# 紧急调试步骤

## 立即执行（在浏览器控制台）

```javascript
// 1. 检查当前状态
console.log('=== 当前认证状态 ===')
console.log('Token:', localStorage.getItem('portalops_token'))
console.log('User:', localStorage.getItem('portalops_user'))
console.log('Cookies:', document.cookie)

// 2. 完全清除（必须执行）
console.log('\n=== 清除所有数据 ===')
localStorage.clear()
sessionStorage.clear()
document.cookie.split(";").forEach(c => {
  document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
})
console.log('✓ 清除完成')

// 3. 刷新页面
location.reload()
```

## 然后重新登录

访问 http://localhost:3000/signin

使用邮箱登录：
- 邮箱: `admin@portalops.com`
- 密码: `password`

## 登录后立即检查

```javascript
// 检查 token 是否存在
console.log('Token after login:', localStorage.getItem('portalops_token'))
console.log('User after login:', localStorage.getItem('portalops_user'))
```

如果仍然没有 token，请截图控制台的所有日志发给我。

