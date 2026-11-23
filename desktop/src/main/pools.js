// Runs `worker` over every item, `limit` at a time.
export async function runPool(items, limit, worker) {
  let next = 0
  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const item = items[next++] // runs synchronously, so two runners never get the same item
      await worker(item)
    }
  })
  await Promise.all(runners)
}
