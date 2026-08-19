const { chromium } = require('playwright')
;(async () => {
  const b = await chromium.launch({ channel: 'chrome' })
  const p = await b.newPage({ viewport: { width: 1500, height: 950 } })
  const net = []
  p.on('response', r => { if (r.status() >= 400) net.push(`${r.status()} ${(r.url().split('following.ae')[1] || r.url()).slice(0, 70)}`) })
  p.on('requestfailed', r => net.push(`FAIL ${(r.url().split('following.ae')[1] || r.url()).slice(0, 70)}`))

  await p.goto('https://platform.following.ae/demo/auth/login', { waitUntil: 'domcontentloaded' })
  await p.waitForTimeout(7000)
  const emails = await p.locator('input[type="email"]').count()
  console.log('login form present:', emails > 0)
  if (emails) {
    await p.fill('input[type="email"]', 'client@analyticsfollowing.com')
    await p.fill('input[type="password"]', 'demo')
    await p.click('button:has-text("Sign In")')
    await p.waitForTimeout(8000)
    console.log('after sign in:', p.url())
    console.log('heading:', (await p.locator('h1,h2').first().textContent().catch(() => ''))?.trim())
  }
  await p.screenshot({ path: process.env.OUT + '/demo-after-login.png' })
  console.log('network failures:', [...new Set(net)].slice(0, 6))
  await b.close()
})()
