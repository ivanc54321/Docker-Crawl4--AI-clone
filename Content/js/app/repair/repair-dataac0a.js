/**
 * Repair-report wizard content (ported from "Request a Repair Design/data.js").
 *
 * This is the single place non-developers edit copy: categories, their sub-items
 * and the "quick check first" self-help tips, plus the urgency wording. Every
 * category is written up (content pass 2026-09-09, TSK-11); "Something else"
 * deliberately has one sub-item so the wizard skips step 3 for it.
 *
 * ASCII only (site convention): icons are inline SVG line drawings, not emoji.
 * Branch name / phone are NOT here - the page reads them from the lettings
 * department in the database (data-branch-* attributes on #rr).
 */
window.REPAIR_DATA = {

  gasEmergencyPhone: "0800 111 999",

  urgency: [
    { id: "routine",   label: "Routine",   time: "about 5 days", responseText: "We will be in touch within 5 working days to arrange access" },
    { id: "urgent",    label: "Urgent",    time: "about 48 hrs", responseText: "A member of the team will call within 48 hours" },
    { id: "emergency", label: "Emergency", time: "Same day",     responseText: "We aim to make contact the same day" }
  ],

  icons: {
    plumbing:        '<svg viewBox="0 0 24 24"><path d="M4 8h9a3 3 0 0 1 3 3v9M13 8V5a2 2 0 0 0-2-2H8M4 6v4M16 20h-4M14 17h4"/></svg>',
    heating:         '<svg viewBox="0 0 24 24"><path d="M12 3c1 3 4 5 4 9a4 4 0 0 1-8 0c0-2 1-3 1-3s1 2 2 2c0-3 1-6 1-8zM6 21h12"/></svg>',
    electrics:       '<svg viewBox="0 0 24 24"><path d="M13 2L5 14h6l-1 8 8-12h-6z"/></svg>',
    locks:           '<svg viewBox="0 0 24 24"><rect x="4" y="11" width="16" height="10" rx="2.5"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/><circle cx="12" cy="16" r="1.2"/></svg>',
    "windows-doors": '<svg viewBox="0 0 24 24"><rect x="4" y="3" width="16" height="18" rx="1.5"/><path d="M12 3v18M4 12h16"/></svg>',
    appliances:      '<svg viewBox="0 0 24 24"><rect x="4" y="3" width="16" height="18" rx="2"/><circle cx="12" cy="13" r="4"/><path d="M7 6.5h.01M10 6.5h.01"/></svg>',
    pests:           '<svg viewBox="0 0 24 24"><path d="M6 14a6 6 0 0 1 12 0v3a4 4 0 0 1-4 4h-4a4 4 0 0 1-4-4zM9 8l-2-4M15 8l2-4M3 14h3M18 14h3M9 13h.01M15 13h.01"/></svg>',
    fabric:          '<svg viewBox="0 0 24 24"><path d="M3 21h18M5 21V10l7-6 7 6v11M9 21v-6h6v6"/></svg>',
    other:           '<svg viewBox="0 0 24 24"><path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>'
  },

  categories: [
    {
      id: "plumbing", label: "Plumbing",
      subitems: [
        { id: "tap", label: "Dripping or leaking tap",
          tip: "Is the drip from the spout, or from underneath near the pipework? Try turning the tap fully off and checking the isolation valve under the sink is open all the way - this fixes it about 1 in 5 times." },
        { id: "pipe", label: "Leaking pipe or joint",
          tip: "If you can safely reach it, turn off the isolation valve nearest the leak to stop the flow of water, and place a bowl or towel underneath in the meantime. Don't attempt to tighten or open any fittings yourself." },
        { id: "toilet", label: "Blocked toilet",
          tip: "A plunger clears most toilet blockages within a few firm plunges. Avoid repeated flushing while it's blocked, as this can cause it to overflow." },
        { id: "drain", label: "Blocked sink, bath or drain",
          tip: "Check the plughole for trapped hair or debris - a drain stick, or removing the U-bend underneath (with a bowl ready to catch water), often clears it without a callout." },
        { id: "hotwater", label: "No hot water",
          tip: "Check your boiler's pressure gauge - if it reads below 1 bar, it may just need re-pressurising via the filling loop. Also check nothing has tripped on your electricity or gas meter." },
        { id: "tank", label: "Water tank or cylinder",
          tip: "Check the immersion heater switch is on and that no fuse has tripped. If you suspect a leak near the tank or any electrics, avoid touching it and switch off the power at the fuse box if it's safe to do so." },
        { id: "other", label: "Something else plumbing-related",
          tip: "No quick check for this one - just add as much detail as you can below. A clear photo of the affected area helps our contractors diagnose it before they even arrive." }
      ]
    },
    {
      id: "heating", label: "Heating & hot water",
      subitems: [
        { id: "no-heating", label: "No heating at all",
          tip: "Check your thermostat is set above room temperature and hasn't lost power. Also check the boiler pressure gauge reads 1 to 1.5 bar; if it's low, try the filling loop." },
        { id: "rad-cold-top", label: "Radiator cold at the top",
          tip: "This is usually trapped air - bleed the radiator with a radiator key, holding a cloth underneath. Turn the boiler off first." },
        { id: "rad-cold-bottom", label: "Radiator cold at the bottom",
          tip: "This is usually a sludge build-up rather than something we can talk you through - flag it below and we'll arrange an assessment." },
        { id: "error-code", label: "Boiler showing an error code",
          tip: "Note the exact code or letters/numbers shown on the display and add them to the description below - this lets the engineer bring the right part first time." },
        { id: "no-hot-water-heating-fine", label: "No hot water (heating is fine)",
          tip: "Check hot water is switched on at the boiler or programmer separately from heating, and that nothing is stuck on the pressure gauge." }
      ]
    },
    {
      id: "electrics", label: "Electrics",
      subitems: [
        { id: "power-cut-part", label: "Power cut to part of the property",
          tip: "Check your fuse box (consumer unit) for a tripped switch and flip it back once. If it trips again immediately, don't keep resetting it - report it instead." },
        { id: "socket-not-working", label: "Socket or switch not working",
          tip: "Test whether it's just one socket or the whole circuit - try a lamp in a different socket on the same wall to narrow it down." },
        { id: "light-fitting", label: "Light fitting or bulb",
          tip: "Try replacing the bulb first with one you know works. If it still doesn't light, it's likely the fitting rather than the bulb." },
        { id: "burning-smell", label: "Burning smell or sparks",
          tip: "Turn off the power at the consumer unit if it's safe to do so, and don't use the socket or fitting again until it's inspected - please select Emergency for this." }
      ]
    },
    {
      id: "locks", label: "Locks & security",
      subitems: [
        { id: "lost-key", label: "Lost or broken key",
          tip: "If you're safely inside and just need a replacement cut, this is Routine. If you're locked out right now, please call the branch directly rather than reporting online." },
        { id: "lock-sticking", label: "Lock not turning or sticking",
          tip: "A light application of a dry lubricant (e.g. graphite spray) in the keyhole sometimes frees a stiff lock - avoid oil-based sprays, which attract dust." },
        { id: "door-not-closing", label: "Door won't close or latch properly",
          tip: "Check nothing is obstructing the door or frame. Doors shifting slightly with the seasons is common in older buildings and is usually a simple adjustment." }
      ]
    },
    {
      id: "windows-doors", label: "Windows & doors",
      subitems: [
        { id: "window-stuck", label: "Window won't open or close",
          tip: "Check the handle is turned fully and the window lock isn't engaged. Timber windows can swell in damp weather and free up again when it dries - please don't force it, as that is how frames and hinges get broken." },
        { id: "broken-glass", label: "Broken or cracked glass",
          tip: "Keep everyone clear of the glass and tape a bin liner or cardboard over the gap for now. If the window is at ground level or the property can't be secured, please select Urgent. If it was caused by a break-in, call the police on 101 first." },
        { id: "misted-glazing", label: "Misted or foggy double glazing",
          tip: "Mist trapped between the two panes means the seal has failed, not that the room is damp. It is a routine replacement - a photo of the whole window from inside helps us order the right unit." },
        { id: "draught", label: "Draughty window or door",
          tip: "Check the trickle vents at the top of the window are closed and the seals aren't torn or hanging loose. Add where the draught comes from (top, bottom, sides) in the description below." },
        { id: "door-wont-lock", label: "External door won't lock or shut",
          tip: "Try lifting the handle fully before turning the key, and check no key is left in the other side. If you can't secure the property tonight, please select Urgent and we will get someone out quickly." },
        { id: "handle-broken", label: "Loose or broken handle",
          tip: "A loose handle usually just needs its screws tightening - check the small screws on the handle plate. If the handle spins freely or has come off, leave it and report it here." },
        { id: "condensation", label: "Condensation or mould around a window",
          tip: "Wipe the moisture each morning and keep the trickle vents open, especially in bedrooms and bathrooms. If mould keeps coming back within a week or so, report it so we can check the ventilation." },
        { id: "other", label: "Something else with a window or door",
          tip: "Add as much detail as you can below - a clear photo of the affected area helps our contractors most." }
      ]
    },
    {
      id: "appliances", label: "Appliances",
      subitems: [
        { id: "cooker", label: "Cooker, hob or oven",
          tip: "If you can smell gas, stop and call the National Gas Emergency line on 0800 111 999 before anything else. Otherwise check the clock or timer isn't set to auto - most ovens will not heat until the clock is set - and that nothing has tripped at the fuse box." },
        { id: "washing-machine", label: "Washing machine",
          tip: "If it won't drain or spin, check the filter (usually behind a small flap at the bottom front - have a towel ready) and that the outlet hose isn't kinked. Note any error code on the display in the description below." },
        { id: "fridge-freezer", label: "Fridge or freezer",
          tip: "Check the dial hasn't been knocked, the door closes fully and there is a gap for air behind and above it. A freezer thick with ice needs defrosting before it will cool properly. Please select Urgent if food is spoiling." },
        { id: "dishwasher", label: "Dishwasher",
          tip: "Clean the filter in the base and check the spray arms turn freely - trapped food stops most machines washing properly. The salt and rinse-aid lights are reminders, not faults." },
        { id: "extractor", label: "Extractor fan or cooker hood",
          tip: "A cooker hood that has gone quiet or weak usually just needs its grease filters washed or replaced. Bathroom fans that have stopped altogether should be reported - they matter for damp." },
        { id: "tumble-dryer", label: "Tumble dryer",
          tip: "Empty the lint filter every load and, on a condenser dryer, empty the water tank. Never run it with a blocked filter - it is a fire risk. If it heats but doesn't dry, that is usually the filter or the condenser." },
        { id: "other", label: "Something else with an appliance",
          tip: "Note the make and model if you can see it, and describe what happens (or doesn't) when you use it. Repairs cover appliances supplied with the property, not ones you have brought with you." }
      ]
    },
    {
      id: "pests", label: "Pests",
      subitems: [
        { id: "mice-rats", label: "Mice or rats",
          tip: "Keep food in sealed containers, clear crumbs and block any obvious gaps you can see. Tell us where you have seen droppings or damage. Rats inside the property - please select Urgent." },
        { id: "wasps-bees", label: "Wasps, bees or hornets nest",
          tip: "Don't disturb the nest and keep nearby windows closed. Tell us exactly where it is (eaves, loft, air brick, garden). Bees are often relocated rather than destroyed, so please don't spray them." },
        { id: "ants", label: "Ants",
          tip: "Wipe the trail with soapy water and keep worktops clear of food - ants are mostly seasonal. Bait stations from a supermarket usually clear them; report it if they keep returning so we can look at the entry point." },
        { id: "bedbugs-fleas", label: "Bed bugs or fleas",
          tip: "Wash bedding and clothes at 60 degrees and vacuum thoroughly, including the mattress seams and under furniture. These need professional treatment, so please report early rather than waiting." },
        { id: "birds-squirrels", label: "Birds or squirrels in the roof",
          tip: "Note where the noise or activity is and at what time of day. Please don't block the entry point yourself - nesting birds are protected and an animal sealed inside causes bigger problems." },
        { id: "other", label: "Something else pest-related",
          tip: "Let us know what you've seen and roughly where, and whether it's an ongoing or one-off sighting. Silverfish and woodlice usually point to damp rather than an infestation." }
      ]
    },
    {
      id: "fabric", label: "Walls, floors & roof",
      subitems: [
        { id: "damp-mould", label: "Damp patch or mould",
          tip: "Keep rooms ventilated and use the extractor when cooking or showering; wipe mould with a fungicidal wash from a supermarket. If the patch spreads, feels wet to the touch or comes back within a week, report it - a photo with something for scale helps." },
        { id: "roof-leak", label: "Water coming in from the roof or ceiling",
          tip: "Put a bucket under the drip, move belongings and electricals away, and note whether it happens in heavy rain or all the time. If water is actively coming in, please select Urgent." },
        { id: "crack", label: "Crack in a wall or ceiling",
          tip: "Hairline cracks are common as buildings move with the seasons and are routine. If a crack appeared suddenly, is wider than a pound coin edge, or runs diagonally from a door or window corner, please select Urgent and add a photo." },
        { id: "floor", label: "Loose or damaged floorboard, tile or carpet",
          tip: "Keep everyone off the damaged area if it could trip someone or give way. A photo showing the room and a close-up of the damage lets us send the right trade." },
        { id: "gutter", label: "Gutter or downpipe overflowing",
          tip: "Note where it overflows and whether water is running down the wall. Overflowing gutters are routine unless they are causing damp inside, in which case please mention that below." },
        { id: "fence-gate", label: "Fence, gate or garden wall",
          tip: "Tell us which side of the garden it is on - shared fences are often the neighbour's responsibility. If a wall or fence panel is unsafe or could fall, keep clear and select Urgent." },
        { id: "external", label: "Render, brickwork or chimney",
          tip: "A photo from outside showing the whole wall or roof, then a close-up, is the most useful thing here. Loose render or bricks at height are a safety issue - please select Urgent." },
        { id: "other", label: "Something else structural",
          tip: "Add as much detail as you can below - a clear photo of the affected area helps our contractors most." }
      ]
    },
    { id: "other", label: "Something else",
      subitems: [ { id: "other", label: "Something not listed above", tip: "Describe the issue in your own words below - we'll route it to the right team." } ] }
  ]
};
