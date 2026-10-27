# iPhone Duo-exclusive distribution research

Checked: **2026-10-27 (UTC)**. Scope: public Apple documentation and Apple staff answers relevant to P01-T04. This is a source-research record, not task acceptance, App Review clearance, or owner approval. No Apple support request was submitted.

## Finding — UNVERIFIED / release blocker remains

No supported public App Store configuration that excludes non-Duo purchases and installations was verified in the sources below. This is **not proof that exclusivity is impossible**: public documentation may be incomplete, and Apple may provide additional guidance.

Preserve the iPhone Duo-exclusive product requirement. `TARGETED_DEVICE_FAMILY = 1` identifies the iPhone family, not Duo exclusivity. Do not invent capability keys, use unrelated requirements to approximate a model filter, substitute an in-app lockout after purchase, or silently broaden distribution. Public release remains blocked until a documented supported route is confirmed and the owner approves it.

## Primary-source evidence

| Source | Observed evidence and limit |
| --- | --- |
| [Apple staff: A Summary of the iPhone Duo Group Lab](https://developer.apple.com/forums/thread/847644) | Directly addresses exclusive release, responding that “you’re still designing for iPhone.” The answers emphasize adaptive iPhone behavior but provide no exclusive-distribution capability key or App Store Connect procedure. They do not establish that exclusivity is prohibited. |
| [Required Device Capabilities](https://developer.apple.com/support/required-device-capabilities/) | Inspected the live page and its HTML capability-selector options. No published option or page text contained Duo, fold, or hinge. This is an observation about the checked page, not a guarantee about unpublished capabilities. |
| [UIRequiredDeviceCapabilities reference](https://developer.apple.com/documentation/bundleresources/information-property-list/uirequireddevicecapabilities) ([official Markdown representation](https://developer.apple.com/documentation/bundleresources/information-property-list/uirequireddevicecapabilities.md)) | Describes capability-based installation restrictions and says, “Specify only the features that your app absolutely requires.” No Duo-specific exclusion mechanism was verified here. |
| [Submitting to the App Store](https://developer.apple.com/app-store/submitting/) | Availability guidance points device requirements to Info.plist. It does not supply a Duo-only configuration. |
| [Manage availability for your app on the App Store](https://developer.apple.com/help/app-store-connect/manage-your-apps-availability/manage-availability-for-your-app-on-the-app-store) | Documents countries/regions and preorder controls, not an iPhone model selector. This page is not an exhaustive proof that no other control exists. |
| [Prepare your app for iPhone Duo — video and transcript](https://developer.apple.com/videos/play/tech-talks/111461/) | Covers SDK adoption, flexible layouts, simulator poses, safe areas, and reserved regions. It does not provide a store eligibility configuration. |
| [Prepare for iPhone Duo](https://developer.apple.com/iphone-duo/prepare/) and [Prepare and submit your apps for iPhone Duo](https://developer.apple.com/news/?id=kkphp5qo) | Describe submission readiness and the optimization badge associated with Duo screenshots. An optimization badge is not evidence of excluding purchases or installs on other iPhones. |

## Smallest next action — owner / Apple Developer Support

The owner should use [Apple Developer Support](https://developer.apple.com/contact/) (sign-in required) to obtain a concrete answer, with App Review guidance if needed:

> Tin Junction requires iPhone Duo’s foldable experience and must be distributed exclusively to iPhone Duo. What documented capability key or App Store Connect mechanism prevents non-Duo customers from purchasing and installing it? Please confirm the supported configuration and any App Review requirements.

Record the response, its date and applicable documentation. Verify the actual eligibility behavior of the proposed configuration before claiming the release gate is satisfied. Until then, the supported mechanism, non-Duo purchase/install exclusion, and review acceptability remain unverified. This research does not change planning state or authorize a scope change.
