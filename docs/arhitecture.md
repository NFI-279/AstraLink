# AstraLink Architecture

## 1. Product Vision

AstraLink is a premium connected-car telemetry and remote-control platform for a 2006 Opel Astra H Caravan.

The product should feel conceptually similar to My BMW, My Renault, or Mercedes-Benz connected vehicle apps rather than a remote diagnostic scanner.

Vehicle data should only be surfaced when it provides meaningful remote convenience, safety, security, or historical value.

## 2. Target Vehicle

- Opel Astra H Caravan
- Registered: September 2006
- Engine: Z16XEP
- Transmission: 5-speed manual
- Steering: LHD
- Head unit: CD30 MP3
- Climate: Electronic Climate Control
- Front windows: Electric
- Rear windows: Manual
- Factory remote central locking
- Cruise control retrofitted and enabled through OP-COM

Exact ECU/module inventory remains to be confirmed using OP-COM.

## 3. Core Safety Principles

AstraLink must never compromise the vehicle's ability to start or operate safely.

AstraLink must sacrifice its own connectivity before risking excessive battery discharge.

Software failure must not be capable of keeping high-power hardware awake indefinitely.

Initial CAN integration must operate strictly in listen-only mode.

Remote lock/unlock is not approved for implementation and requires a separate security review.

AstraLink must not interfere with the ECU, immobilizer, or safety-critical vehicle functions.

## 4. Power Architecture

### Active State

Triggered by ignition/vehicle-awake state.

Available systems may include:

- MCU
- CAN interfaces
- cellular modem
- GNSS
- telemetry collection
- trip tracking
- backend connectivity

### Shutdown Sync State

Triggered when ignition transitions from ON to OFF.

AstraLink remains powered briefly in order to:

- capture final fuel level
- capture front-window state
- capture door/boot/lock state if available
- obtain final GNSS position
- close the active trip
- upload the final vehicle snapshot
- confirm or attempt delivery

Expected duration is approximately 30–60 seconds, subject to hardware validation.

### Parked State

For v1, AstraLink does not require continuous parked connectivity.

After shutdown synchronization, the main system should fully power down or enter a negligible-consumption state.

Parked connectivity may be added in a later hardware revision.

### Deployment Modes

#### Mode A — ignition-switched

AstraLink is powered only while ignition is available, with a temporary hold-up power mechanism for shutdown synchronization.

This mode provides maximum protection against parasitic battery drain.

#### Mode B — permanent-power capable

The hardware may support a fused permanent 12 V input and a separate ignition-state input.

Permanent parked connectivity is optional and disabled by default.

The same hardware should remain usable in Mode A.

## 5. Hardware Safety Requirements

The final vehicle node must include appropriate automotive electrical protection.

Requirements include:

- dedicated fuse
- reverse-polarity protection
- transient protection
- load-dump protection
- cranking-voltage tolerance
- overcurrent protection
- hardware undervoltage cutoff
- hardware maximum-awake timeout
- safe shutdown behavior

The hardware undervoltage cutoff must disable AstraLink before vehicle starting reliability is endangered.

A software fault must not be able to leave the cellular modem or other high-current domain awake indefinitely.

## 6. Vehicle Network Policy

Initial development is strictly passive.

No vehicle commands are transmitted during the discovery and telemetry phase.

Potential Astra H networks include:

- HS-CAN
- MS-CAN
- LS/SW-CAN

The exact buses required by AstraLink will be determined through vehicle discovery and OP-COM/module inventory.

The hardware architecture must not assume all required signals are available on a single CAN network.

## 7. Product Features

### Core

- Vehicle status after shutdown
- Front-window state
- Window-left-open notification
- Fuel level at shutdown
- Fuel percentage if signal quality permits
- Estimated cost to refill the tank
- Last parked location
- Map-based vehicle location
- Parked duration
- Trip history
- Trip distance
- Trip duration
- Ignition/engine state for internal logic and safety
- Remote light flash in a later active-command phase
- Remote honk in a later active-command phase

### Remote Command Safety

Remote horn and light commands are not part of the initial listen-only phase.

When introduced, they should only be permitted under safe vehicle conditions.

Initial proposed interlocks:

- AstraLink connected
- vehicle awake
- vehicle speed below approximately 3 km/h
- handbrake engaged if that signal is reliably available
- authenticated command
- short command lifetime
- replay protection

Exact conditions remain subject to vehicle-signal discovery.

### Optional / Later

- Refuelling history
- Monthly driving summary
- Park Guard
- parked battery monitoring
- advanced parked connectivity
- vehicle connectivity history

### Deferred

- DTC/diagnostics
- active diagnostic polling
- remote lock/unlock

Remote lock/unlock requires a separate security threat model before implementation.

## 8. Explicitly Out of Scope

- Remote vehicle movement
- Remote driving
- Instrument-cluster needle sweep
- Rear manual-window sensors
- Immobilizer modification
- Key programming
- automatic DTC clearing

## 9. Mobile Client

AstraLink v1 uses a PWA.

The client should feel like a premium modern connected-car application.

Native/system browser surfaces should be used whenever the web platform exposes them.

Examples include:

- passkeys/WebAuthn
- iOS biometric authentication where invoked by the system
- share sheet
- platform-native input behavior

Ordinary PWA controls cannot literally use SwiftUI/UIKit and must use a high-quality iOS-oriented component system.

The UI should avoid raw diagnostic-style telemetry unless it has direct user value.

## 10. Backend

Initial backend assumptions:

- Node.js
- TypeScript
- PostgreSQL
- Docker
- local development on Windows

Exact framework remains open.

Candidates include:

- NestJS
- Fastify

Backend responsibilities will include:

- authentication
- vehicle identity
- telemetry ingestion
- trip storage
- last-known vehicle state
- location storage
- remote-command authorization
- command expiry/replay protection
- notifications

## 11. Open Technical Decisions

- Exact Astra H ECU/module inventory
- Exact required vehicle buses
- Exact CAN/SWCAN signal availability
- Exact ESP32-family MCU
- Exact CAN transceivers
- SW-CAN transceiver requirement
- LTE technology
- Romanian carrier compatibility
- SIM/eSIM strategy
- GNSS integration
- hold-up power design
- shutdown synchronization duration
- backend framework
- PWA framework/component library
- exact vehicle-state safety interlocks
- handbrake signal availability
- lock-state availability
- front-window position/state accuracy

## 12. Development Phases

### Phase 1
Vehicle discovery and strict listen-only CAN capture.

### Phase 2
Passive telemetry decoding.

### Phase 3
Ignition-switched vehicle node and shutdown synchronization.

### Phase 4
Backend and PWA integration.

### Phase 5
Hardware protection and power validation.

### Phase 6
Controlled active commands for horn/lights.

### Future
Parked connectivity, Park Guard, diagnostics, and remote lock security evaluation.