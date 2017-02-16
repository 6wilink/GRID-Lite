-- random
-- by Qige
-- 2017.01.05

seed = {}

function seed.seed()
  --return math.randomseed(tostring(os.time()):reverse():sub(1, 6))
  return tostring(os.time()):reverse():sub(1, 6)
end

function seed.random(from, to)
  math.randomseed(seed.seed())
  return math.random(from, to)
end

return seed
