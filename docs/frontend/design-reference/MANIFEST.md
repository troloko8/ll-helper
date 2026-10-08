# Stitch Screen Manifest — CyberCognition LL Helper

This is the single owner of exact Stitch resource IDs. `docs/frontend/DESIGN.md`
owns screen names, tokens and shell rules; the integration map owns routes and
API readiness. Do not duplicate these IDs elsewhere.

**Canonical project:** `LL Helper Design System` —
`projects/8241473581937023308`.

**Verified:** 2026-10-08 via Stitch MCP project metadata, `list_screens`, and
direct retrieval of the main product screens. The project currently has 77
screens. Earlier resource IDs were stale after Stitch regeneration: 50 of 78
IDs previously recorded here no longer existed. The tables below replace those
IDs with the live inventory.

## Rules for every reference

- Screens are visual and structural references only. Never copy generated HTML
  or JavaScript into the application.
- Backend contracts own persisted values, authorization, validation and error
  semantics. In particular, study-answer correctness and progress figures are
  never calculated from a Stitch prototype.
- `DESIGN.md` overrides visual drift, literal token values and prototype copy.
- Social metrics, ratings, likes, follows and bookmarks have no approved
  product/API contract; do not implement them solely because a prototype shows
  them.

## Canonical screen inventory

| Flow | Canonical reference | Platform | Live screen ID | State references |
|---|---|---|---|---|
| Auth | `login_llhelper` | Desktop + responsive mobile adaptation | `9aa2b2b18b4e4911b484d5b491694044` | — |
| Auth | `register_llhelper_refined` | Desktop + responsive mobile adaptation | `83bcafeb70ce45d1b570059825ef3a26` | — |
| Auth | `onboarding_profile_setup_llhelper` | Desktop | `f7c5d7da443c4e9b826101f68e7bd0c6` | validation `41a9f19d728047949cc19a5810e64fb8`; conflict `0fbf8c1b90784448bf69f4cf16036fe9`; submitting `3d539bd44d5749e39da88a6f6664e3b9` |
| Auth | `complete_your_profile_mobile_base` | Mobile | `5413fe9f218142f7a771991885835ac8` | — |
| Learning | `learning_llhelper_refined_navigation` | Desktop | `61529bf110c94e5a859f3268ad919809` | loading `be473dcedb8341d0a57e3e322ada0526`; API error `cbfdbbcd27cf41d88669ede54fac694f`; empty `3780783c13f54d6b88aced35bc271b71` |
| Learning | `learning_mobile_dashboard` | Mobile | `efd5e24b5e02402a8716c2a590bf681f` | loading `4e1f1dd85a7241f8b203043770210d24`; API error `bf694bc2ed3e41c599becdd220607d18`; empty `a887cc6f03dd4b6699e58ba76658270f` |
| Created | `created_decks_llhelper_refined_mvp` | Desktop | `4b2d06a0a1404dc6b56758ceb61acb45` | API error `fb8c0758a6b74fc18ee98fe71437cfba`; empty `97e6097de37c42ddb97202a7ebcb638a` |
| Created | `created_decks_mobile_with_bottom_nav` | Mobile | `f252b5a136f647cd9d1542555dad20fb` | loading `c4fcfe553ca4466db388967a669ba494`; API error `b909ce2e83cc473d8e0565b18c194ece`; empty `4ac98a6a78fa442193a1da411859ade7` |
| Deck form | `create_deck_llhelper` | Desktop | `e4493c59835d419ca58096bba693982b` | validation `a4b26e0bd0f2452c8105aa6a2abc2380`; submission error `15c89bfc915a4069a480db8fc4903b2b` |
| Deck form | `create_deck_refined_mobile_state` | Mobile | `5c7e8188d0b045b2b69ec7d53be911e9` | — |
| Deck form | `edit_deck_llhelper_refined_1` | Desktop | `190af41e0b0c45f8a2afb6b51909a61f` | shared loading, form-error and destructive-confirmation patterns |
| Deck form | responsive adaptation of `edit_deck_llhelper_refined_1` | Mobile | **No live Stitch screen** | Use the desktop hierarchy with canonical mobile shell until a mobile reference is recreated and deliberately accepted. |
| Deck details | `deck_details_owner_llhelper_refined` | Desktop | `01c8b494336441fd8e264978697402ee` | loading `7f5077df0be4460aacf59ec1041aae68`; API error `b1337bedbdf149cf90ebecc7aa00d991`; empty `75d6eba66f6241efa36bf5c1ed83e064` |
| Deck details | `deck_details_owner_mobile_2` | Mobile | `ccdfafe064aa4365ba041ed02607151b` | loading `3fd36bb548eb463c8c3d55aa9af7cedf`; API error `350c42b842964c4fa6748332714a62d6`; empty `3487d49d5ba7464484f4891eec8c1c8e` |
| Deck details | `deck_details_public_llhelper_refined` | Desktop | `52404acbd22344d790db7fcbc7b1840c` | shared loading/error patterns |
| Deck details | `deck_details_public_mobile_refined` | Mobile | `06388e7896124660b6830e9291cb9f74` | shared loading/error patterns |
| Learning detail | `learning_deck_details_llhelper_refined` | Desktop | `dbf47f4360f74f439b00e28229f32df4` | shared learning-aware loading/error patterns |
| Learning detail | `learning_deck_details_mobile_refined_2` | Mobile | `cac865fc9ea94e2abcad0a2af3ac0922` | shared learning-aware loading/error patterns |
| Card detail | `card_details_owner` | Desktop + responsive mobile adaptation | `6e069c7228fd4bf3b7f6d3bf7f6a5b2d` | shared loading/error patterns |
| Card form | `add_edit_card_llhelper_refined` | Desktop | `a0178048f8bc49159c4f0f610e932e39` | AI loading `358200a5055a4fe2bacf2259adc4762c`; AI error `454166b45867470391952fa11bc020e3`; submission error `5022ce12195e487b995cf2ef675e1048`; validation `31297dc4a8e34d6082c94539926a8cd0` |
| Card form | `add_card_mobile` | Mobile | `b8bbf6c21e9d46aa8edd11cdd374bb62` | shared form patterns |
| Study | `study_english_b1_llhelper_refined` | Desktop | `d3ec2055a0724909b706649756c41913` | loading `67d7abcb9b6b4e0783a5c08a3010df0f`; API error `06eb438243504da9a13afb23037d8107`; caught up `94fda5b37748433e97db4b970b189eff`; complete `ebf6b6cb271e446b9bdfff5d4e11a441` |
| Study | `study_english_b1_mobile` | Mobile | `32b53362748742a19dfc7b4cc15b1a97` | loading `2894882fd954456a8ffc5eda7e95fe65`; API error `b5f6562b8ff3464b8d1bd25f0390f510`; caught up `6d42f1332a8b409cb376c7b81cc6f4e8`; complete `ae6e28fd937b4d2e8bf96fa1d7098745` |
| Discover | `discover_llhelper_refined` | Desktop | `17ceff56c3db4a808566c16ed212db7d` | loading `e8150da0386147cf873afdd57286b95f`; API error `8b29aac4d7e74fb59838fd5af2fbd820`; empty `1d837f19ba2e4c66aac4b070fae16d5c` |
| Discover | `discover_mobile` | Mobile | `9aaf765ffdfb4a0595da18e8c28d0bb6` | loading `6ab80ffecc5d40c6ac73f3684a6f764b`; API error `f87fd1a533a4495194720d6d3a3d065a`; empty `6332e210465d47d58f011bc22a663d72` |
| Creator | `creator_profile_llhelper_refined` | Desktop | `fa53871c071f4f6a89bcc07800e37ff5` | shared page/list states |
| Creator | `creator_profile_mobile` | Mobile | `87d2a4d2e36940c6b8fb7299259a23a4` | shared page/list states |
| Progress | `learning_progress_llhelper_mvp` | Desktop | `c3b92c2328b541caa28cd4e59fa587c6` | loading `b8e7b6f0f43c4bee89fa349ff52852b8`; API error `28b24c5c4191482e9516eab58b548cd8`; empty `2ee9712be169417aa9f2cf36a9a39f9d` |
| Progress | `learning_progress_mobile_2` | Mobile | `786fef679a554769bdf277a497e261c9` | loading `0e6da83508d24bf9a569afe4b85bf2e5`; API error `61efdd5100f7452eab64285063da4702`; empty `0579e6f9cf6a4646b07247abe3b2dbc5` |

## Explicit exclusions and gaps

- The project has no live mobile Edit Deck screen. That is a design-asset gap,
  not permission to invent a different page; use the documented responsive
  adaptation until Stitch supplies and the project accepts a replacement.
- `952df1252a6847c29daad282a6970113` ("My Decks — Loading State") and
  `58719fc4cbc54eafa68277e1af62e185` ("Vocabulary Flashcard App") are
  non-canonical screens.
- `148b01c099d844d39a5c6c3b752adefd` ("Add Card — Refined Mobile State") is
  supplementary only. It is not the canonical base for `add_card_mobile`.
