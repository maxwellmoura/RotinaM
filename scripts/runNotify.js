const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function main() {
  const url = process.argv[2] || 'http://localhost:3000/api/notify-due';
  const res = await fetch(url);
  const text = await res.text();
  console.log(res.status, text);
}
main();
