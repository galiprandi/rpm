# Propuesta de Categorización — RPM Accesorios

> **Fecha:** Julio 2026 | **Total de productos activos:** 1800

## Sección 1: Resumen para Responsables

### Contexto Actual

Actualmente RPM Accesorios cuenta con **1800 productos activos** en su base de datos, todos etiquetados bajo la categoría "Sin categoría". La tienda pública actual opera con **8 productos hardcodeados** y **6 categorías fijas** (Iluminación, Estética, Equipamiento, Seguridad, Interior) que no reflejan la verdadera dimensión del catálogo.

### Cambio Propuesto

Migrar el catálogo público a la base de datos real, organizando los 1800 productos en **15 categorías** orientadas al cliente final. Cada categoría agrupa productos por tipo (lo que *es* el producto), facilitando la navegación y búsqueda.

### Las 15 Categorías Propuestas

| # | Categoría | Productos | ¿Qué incluye? |
|---|-----------|-----------|---------------|
| 1 | **Deflectores** | 277 | Deflectores de ventanilla y capot para todas las marcas y modelos |
| 2 | **Iluminación** | 250 | Focos LED, halógenos, lámparas, kits de iluminación, DRL, tiras LED, ojos de ángel |
| 3 | **Audio y Multimedia** | 234 | Estéreos, parlantes, subwoofers, tweeters, drivers, amplificadores, frentes adaptadores, cables y accesorios de audio |
| 4 | **Limpieza y Detailing** | 179 | Productos de limpieza automotriz: shampoos, ceras, limpiadores, acondicionadores, selladores cerámicos, paños, microfibras |
| 5 | **Accesorios Exterior** | 127 | Antenas, escobillas limpiaparabrisas, colas de escape, estribos, barreros, lonas, aletones, vinilos, barras San Antonio |
| 6 | **Iluminación Auxiliar** | 93 | Faros auxiliares, neblineros, apliques cromados para faros |
| 7 | **Seguridad** | 38 | Alarmas, antirrobos de rueda, sirenas, bocinas, bulbos de puerta, carcasas de control |
| 8 | **Enganches y Carga** | 125 | Enganches, bochas de remolque, portatablas, barras de techo, caños elípticos, cintas de amarre y remolque |
| 9 | **Accesorios Interior** | 110 | Alfombras, cubre volantes, fundas de asiento, cortinas parasol, palancas de cambio, posavasos, llaveros, soportes para celular, portapatentes |
| 10 | **Fundas y Carcasas** | 4 | Fundas de llave, carcasas de llave |
| 11 | **Carrocería y Partes** | 167 | Manijas, espejos, ópticas, parrillas, paragolpes, máscaras, vidrios, molduras |
| 12 | **Eléctrico** | 75 | Cargadores USB, fusibles, conectores eléctricos, cables de batería, relays, botones pulsadores, transformadores |
| 13 | **Herramientas y Mantenimiento** | 109 | Herramientas, líquidos y fluidos, lubricantes, pegamentos y adhesivos, pilas, butacón |
| 14 | **Seguridad Vial** | 7 | Botiquines, balizas, kits de emergencia, matafuegos, cables puente, elementos de seguridad vial |
| 15 | **Aromatizantes** | 4 | Aromatizantes y atomizadores ambientales para el vehículo |
| | **TOTAL** | **1799** | |

### Beneficios

- **Navegación intuitiva:** El cliente encuentra productos por tipo, como en cualquier tienda online de autopartes
- **Catálogo completo visible:** Los 1800 productos activos pasan a ser navegables, no solo 8
- **Consistencia:** Cada producto pertenece a una única categoría bien definida
- **Escalable:** Nuevos productos se asignan fácilmente a la categoría correspondiente

### Nota sobre Nombres de Productos

Se identificaron productos cuyos nombres actuales no son ideales para un catálogo público (formato incorrecto, mayúsculas sostenidas, nombres excesivamente largos o genéricos). En la Sección 2 se detalla cada caso con el nombre sugerido.

### Próximos Pasos

1. Revisar y aprobar esta propuesta de categorización
2. Crear las 15 categorías en la base de datos
3. Asignar cada producto a su categoría
4. Renombrar los productos identificados
5. Actualizar la web pública para consumir datos desde la DB

---

## Sección 2: Detalle Técnico para Implementación

### 1. Deflectores

**SQL — Crear categoría:**
```sql
INSERT INTO category (id, name, description, color, "sortOrder", "isActive")
VALUES ('cat-deflectores', 'Deflectores', 'Deflectores de ventanilla y capot para todas las marcas y modelos', '#3B82F6', 1, true);
```

**SQL — Asignar productos a esta categoría:**
```sql
UPDATE product SET "categoryId" = 'cat-deflectores' WHERE id IN (
  '45558de1-2861-401e-8a28-4877a0be7034',
  'cb45d6f1-6386-4351-a840-a22e49b06ac4',
  '45fbd15f-9eea-4bbd-ae28-c2068773a1f8',
  'b4c0890b-6366-4fdc-9d41-85a1d5b546a7',
  'b0112f45-b430-4e29-b0b7-e3b636e58f89',
  'b963d5b4-d762-4d37-91a3-784a239b6417',
  '5b76dd5b-87a1-4894-a172-e58c71276505',
  'cab3bed5-859d-4e98-9706-76e3fc58f5a3',
  'f5ef9cf3-aa03-4c38-b460-c72017df099d',
  'b61609d4-efb9-4882-84dc-f0e6e111cded',
  '58e161b3-537c-42e0-ae88-548ffc2848e1',
  '8cb09d67-4cec-4339-a511-b1946627d99e',
  'b5ce4615-d0a6-4c28-ae98-d5b4265184e2',
  'be7fff47-df68-4678-af6c-fcf59a940800',
  '61836e8d-667b-4b9f-9f4e-1fa9c5995eb9',
  '5b7cf845-f179-4f6c-b1b2-6033a55bb9e0',
  'e525f85e-9ca4-4ceb-a89b-ddfeaff943bb',
  '410af8dc-36e2-406a-a194-08d38b0dbd36',
  'd39737f7-73ef-4894-8d99-a3e4fa9a4164',
  '39d680da-48a6-4d9b-9551-13a53d37f31a',
  '9dd43c45-7cd1-4f74-b32c-a132d1475743',
  'c3e308d4-ef51-4c6d-ae46-671da45db4c2',
  'c6c3d26d-5d04-4242-a69c-b6444df7d484',
  '13bc6ee5-f3dd-46a0-8769-3fec52855936',
  'de302b02-cd1b-432f-b107-b158e24d467e',
  '5324bf68-3bf0-4d79-9e2a-937a43d64762',
  'c1c554ad-55cd-4ec4-8ac1-17f0d149759a',
  '9eddc3f6-7fe0-44d8-a852-7cd92520b0ee',
  '8734f39c-8664-4f87-99e0-0926d454ce35',
  '87b4fd79-ad54-4fba-8adc-ae55002f7d7b',
  '2affb5b5-88e1-4dd6-8408-4adfa5492a14',
  '64247f4b-8a55-43f5-9dff-a67dbfb3a651',
  'd62fb652-c020-4a70-ab55-4e1ef9dcdd20',
  '74768376-4675-4b12-affe-a0fc3452f0d4',
  '00bf3db1-a30c-4d4c-b946-6b99aeb7c031',
  'bcdb0459-b12c-43db-8532-205cf6576ebf',
  '8772067b-910b-49b0-982c-a108d9878d04',
  '9523d25e-2be5-469b-b814-fda4575f3994',
  '5734d003-850c-4141-9235-a608c189c38d',
  '3c7f6f1f-755f-429d-adaa-618013d4e25d',
  '028c274e-34b2-4ea4-9475-10613da23cbb',
  '6099d2cc-37d1-4eef-8f8c-3b6921c02cbf',
  '2d32546c-4481-4be8-a7a3-b34e1b4042f9',
  'b4f30eb9-64c5-4513-8c3c-22228bf930c9',
  'c5a6726a-f7a4-45ad-b83c-549fc0953941',
  '3fef8033-01bc-4675-bda3-ae341476cb53',
  '470a4159-43a7-4b2c-8012-c86ec589f1cd',
  '2bafe4c3-24f7-4041-91da-243a07ddaeb5',
  '728b9272-08eb-498d-9030-b14504effcd2',
  'dd0bdf25-a775-4fb2-957d-e40ea8ba3917',
  '2909bd37-1e1f-4d05-903c-1c217ffdb477',
  'e7cb7ab2-dade-4586-979d-2a8d405db7f1',
  '970d668b-ae7d-4053-ac57-0fb5b11b0706',
  '2d514418-f17d-4427-b64d-145239d8699a',
  '8433193d-6589-42f9-96bb-a3bae3ae4a81',
  '9d21c623-5e05-4c41-b501-a9717696c502',
  'ffdbe60c-0325-4c52-8ff0-b01dda815d95',
  '05d97e47-61c8-4fe2-bfb9-27a2ce38cec0',
  '83990069-3edf-4c7b-9566-b2577b22a08d',
  'e77632cd-f191-436b-9349-28078b5a7c81',
  '55b27514-d8ad-4166-83e1-ffeec8727ff2',
  '53def5a4-2913-471c-86dd-baad6de63bbd',
  'f82fba92-a812-490e-b65b-b8556952ab7c',
  '67197480-269b-42c0-b3ff-6c04c05fedfb',
  '5fe939be-1454-4529-bec5-4090644f3236',
  'd24b2310-f177-42fa-b3af-9d5fda7edd8f',
  'becc512e-1f4f-4b42-81df-18eae182df2b',
  '4a83ec5c-a80f-4630-8332-f38655ca1d57',
  '1014413e-bc1d-40e1-b10a-f43b4743e410',
  'a8a94c70-f286-470c-978c-aae990a04e81',
  'd6c4b14c-5545-478a-b9d2-6cd7503459a3',
  '0fb18fb7-6877-4e15-9b7e-bdc14f6ed138',
  '17eab3f8-7495-4788-8579-7acb1c28bcd4',
  '1232dd58-93c0-4c04-9127-e624fd0c7c1d',
  'd5a36cce-12e7-43f4-ab18-3b0f8d169498',
  '8530e9d1-1e6a-4cc2-9266-85dbf3a019ba',
  '03209ba8-96c5-4ebe-9acb-f9323ec03c4e',
  'a911d90a-ab97-47dd-944e-bfe43a852146',
  '7f4be331-49ed-402e-8092-52c7b3aed742',
  '9b403b3a-aee0-4df3-9579-7ddd602a338e',
  '365517c6-270f-4f03-b0c8-3a5cf6fde89d',
  '76779441-67d3-4438-9b1c-52e267fdf659',
  'b55cb002-29f9-4f0a-af83-54cc7ad2df44',
  '45d4307f-71d8-4f14-8afa-daa5fe7cfc62',
  '3b6ed37d-42b6-4bbd-b8c2-c720319b6f83',
  'c54ec7a6-444f-4d43-9c8d-edef2af14e65',
  'dc00220a-4211-463c-b3d8-c0aee6cbf7e4',
  '3d82514c-2777-4a84-ad66-3fd711d155f6',
  'd14691d8-0f9d-4a8c-85f6-8c2745a8eb9f',
  'db8f22dd-6c9c-490e-ba3c-a6f557ecf530',
  'd1cb8ebe-4999-4bc8-82b3-aaa80905e642',
  '281fdd04-9746-424b-8a2d-698c7ce07eae',
  '15ca461c-af04-4478-8bba-01a7ccf3348d',
  '0825faab-8ffb-4264-a462-95ac438d5f85',
  '3bb3913c-0001-4fbc-8c2c-0e7f2b9cd160',
  'f8b087ba-301e-4dba-b7cc-21afb7433302',
  '6db14d96-6b64-4a20-a103-ab0625714e76',
  '3c2f7458-9b5b-47d5-a48b-f68b9023979a',
  'a0d939b6-355d-4dc2-89ec-eeb39e537f91',
  '265aba49-30bc-49d4-9f80-03ce50aef43f',
  '64899498-e047-4157-897f-460d1f5e7ed5',
  '485db360-8e47-49b8-877b-9187fdfc2a23',
  '276e1363-8def-4988-8020-b34c1e374edb',
  '3f18091c-b763-4ac7-b488-ce34312bd8a6',
  '62561352-96ed-4cde-94ca-ef3171a3bc14',
  'f265ad8d-010e-4cfd-8ab1-b1d9adc2c91b',
  '7cb2e3f6-c72a-4bf6-acbf-e491abe40e6d',
  '177ad7d0-a5c6-45c8-ae99-246d69570662',
  '85bd9620-3f46-4ff5-bf6c-3f356df6138b',
  '0ecbbefc-8552-427e-98bc-e99fc70bf8a2',
  'bf93c952-f33f-4dd2-bdb7-b8935239a8fd',
  'e1cfa585-e4b7-4936-aa3a-221c03fb259f',
  '07d8a912-6525-40a4-ae0d-87332b52c9f2',
  'cc9ddd88-1eef-438a-b301-cc109ccd3cc7',
  'c8c42a13-13f2-4796-9c3d-0ef0fc0f499b',
  '1995e923-b2e9-404a-8334-f1651d884c16',
  '25d38ec1-7285-43fe-8317-d912f167cf8f',
  'd15bf7c2-b96e-4f97-867a-fc6a296e4d8d',
  'a31c37aa-d001-4217-9991-f805c6ff63e7',
  '4122e1cf-3d94-4c32-a625-9bb301ef3f94',
  '23163b31-4212-4f50-beb2-cee46959c359',
  '85ed9229-1dd8-446f-be17-d2c6de0844d0',
  'cc82d4d2-216f-4957-bcad-676074400865',
  '60f2dec4-8093-4e81-8be3-df8a2d392779',
  '78a1d6dd-55f5-4d91-b7f5-102d4eb7ff59',
  '077fdfef-a9ea-4251-bce7-ac7cba054842',
  '18a14ed7-c52c-41b3-b624-68be01d334c3',
  '3625f826-9cb2-47ab-a0a5-bda421504dfc',
  'e3bf871a-d597-408b-a858-c57fcd0e5473',
  'f3dd7181-c68d-4909-bd17-6a67f54f9127',
  '3fa20df3-3abc-4bae-818d-cd3333e32e7a',
  '85fedfe8-9fe7-42eb-a6c7-ff5326797353',
  'a4ee47af-1edb-40e5-9d68-4513cb44f57d',
  'bf70eb85-1a49-45b2-b926-493597156ac4',
  'fa9fd49d-5d72-41b5-9ff4-e08d2486712d',
  '2a9332f3-cccf-4b03-ab39-daa9af0f0a88',
  '4d853ed8-ca1b-4b0e-bc38-dcdc8e61d896',
  '0c7445fe-886e-46d5-ba06-905f74223c27',
  'f6a81c33-7636-49d4-a4c4-76d1dbe560b9',
  'e492437f-31b1-450f-bd18-a06cb72322fd',
  'f397ade2-5013-47d2-a4b2-3d3399322c57',
  '6ae531a5-b4e2-4a91-bffa-3414c44691d1',
  '41bd1cb9-50be-41a5-b25c-bcae868afb2a',
  'c74f6d50-7447-4f44-92ca-593943c98dd9',
  'b315a89f-6328-40ed-8693-1061b00d29d7',
  '4e743f0c-532d-4302-b02c-57f9d4b64a73',
  '1932df9a-f8dd-4d37-bf16-483ab94f1a69',
  '9a6426a8-f530-4f6f-86bc-38f1272c6b44',
  '82bac057-86e7-4f4f-bb33-3883c2c24af5',
  'ac21dd0a-0047-4284-8d27-19f998b5c0ff',
  'cd2e8786-7e2b-4ec3-90c3-2e911b78af13',
  '881ae8af-efdd-418a-9110-ce2c32abfd3c',
  'e76b8236-153d-49ae-9cb7-0f9e555f32ff',
  '75b7b154-54e3-4b5e-836a-6002855b6d65',
  '76484da1-8e6d-4bb8-b3b2-8961c43ba44c',
  '1c0513ac-945b-4756-b4ef-a0ca7706a0ee',
  '7cf28aef-7187-4f53-82a7-78169272b3a2',
  '8955537b-22b8-430b-b9fe-c56007e3073d',
  '11001c7d-2a34-4afa-ace6-194d43700f55',
  '998a2eed-9dee-4e1f-b2c5-97262805eff4',
  '660d62d9-d647-4020-a39f-3ca4ae201485',
  'b68a0377-a188-413f-8a15-bca752d70c8c',
  '2e0358cc-2924-4ff2-badb-b8e6cfde9121',
  'ea6452c3-89bc-47cc-8433-6d95f0411385',
  'ec5ae2d0-4253-47d4-a47c-6aa9f3ef87bf',
  '841c1c2e-ebbc-4af9-9997-507fcb34effa',
  'c37dd9e3-a0c3-4a56-ba17-a0a08545400b',
  '051e3f9b-fd78-4a7a-8453-aea2e217449c',
  '5eb516fd-a5e9-4a3e-9e90-743c60c38aa4',
  'ff87aec6-0399-4527-9f7f-96c1cd158471',
  '83bbccd9-2a2e-450f-87b8-8882d0998471',
  'a3bb8f7c-a677-42e9-a758-b00855abbb89',
  'e68024f5-52d5-4a96-b2e1-d7abb549dcab',
  '62269121-0f56-4fad-8751-133550020309',
  '88eb4263-b76e-4dd5-8105-0c1e647a54a4',
  'd9db10b8-d990-475b-ad45-52d9fb9b4e55',
  'b3b41d90-84e1-4a3f-9c57-3e2f7cbe59a4',
  '15f6be3e-e575-48d0-abbd-1f6c80a681d0',
  'f003abbf-7eae-41e0-a80d-c3e65a9b0648',
  '3ae1ab25-6718-4fe5-84a3-2213c86eb594',
  '2470eb1a-7024-4e2f-88be-2336c8f5237d',
  '782adb1a-0bf2-49d6-bcc0-5a396847c46a',
  'ac08e12c-ad4c-4708-bc7e-b67c993dd550',
  'eea66cf3-2c41-495d-b1d6-d1a0853ec2cf',
  'b0567ed0-e1d6-4b11-b492-5f5847dd4dfd',
  'd2d657a9-270e-44eb-8161-b4e95e793a27',
  '2748ce6b-a3ac-47f9-a616-b010074d49f6',
  '9f23cd2f-9b9c-4abd-8e9e-c8a586ddf80f',
  '6e7949e4-e07b-4eb4-8396-30f02947c583',
  'b4fa3ea1-4728-46a8-8427-7f4e6d1ef559',
  '5c3e2ab9-6652-4227-9e65-1eb1322492c1',
  '512bf026-13c4-4506-a4a7-1c6e30d71276',
  'f45e5269-f526-425a-a42c-a626cae5034a',
  '33e67103-49a3-4bc1-84d1-ab466fb6178e',
  '1f4863c6-58d8-4ecb-89d5-be7c7da75ad0',
  'ddcc5c19-4c76-4f25-b8f5-46e04805c76b',
  '46c09b79-ac72-4824-91f6-9ff798e8d3b9',
  '7054c4fc-00e2-4e00-aec7-2fcda8ccd983',
  '4a41f7ef-a103-4db0-9cd4-883bed64d25c',
  '03bc3682-16ce-429e-9420-e0d151292f3c',
  '604d83ec-7658-432d-b8fc-cc348f27303f',
  'b9eadc1c-dfad-42e5-81f4-e7b8dfe1bb95',
  '176ec189-8221-480b-9eeb-4cd7cad75c42',
  'd866c57f-f97f-4db4-a5a0-7d675d98d78a',
  'fb6f52c6-c62f-400e-9ba3-20354d6547fa',
  '2e1391eb-efc3-4238-a621-466b12529703',
  'f7df3e16-1a70-432c-8d49-ac15c7360e06',
  'c15f7973-c542-4828-927b-c49e161e8f1e',
  'ac16de30-a0fa-4cbc-8909-050fbaad926f',
  'd1662033-da84-404c-af76-eb891bcc08f8',
  '3d4bf0cb-0dfc-42ff-a42c-061f175ba1e9',
  '34c732dc-ed41-4bf4-bb26-068695695d91',
  '04b3963d-2c9c-4e67-9189-e82258aeac3f',
  'e17cd6ec-a1c1-462d-8d85-d8cd47412b6b',
  'c47214d4-76a3-47de-ba70-7666ccf93b71',
  '5052f7e1-a21b-402d-8d5a-4c66cdfa7708',
  '670d74d0-79f6-4637-bf8c-bd21fcc780c1',
  '589320f9-b63b-48cb-9b9c-8fc261388235',
  'f8b7e672-9667-47a8-9055-a1c6c16b4c78',
  'c0ac3f2d-0008-48d1-a119-f6c3d129ef27',
  '4c902596-0c8c-4de4-9473-e029358ff818',
  'bef6190b-06aa-4f58-83b9-d4c6a5bdcf3a',
  '35d15d03-d23a-436f-b48d-1f68c986d9d0',
  'de82830d-2ae6-4006-b702-1df6f2e491ea',
  '1868fa96-b494-4ab1-8299-1e2ad42673ce',
  '6ecf4d0b-15cd-4a91-97e0-593e37587bec',
  '3364d1e2-e960-4110-b0ba-4dfe35e7dd2a',
  'f936d49f-6a1d-4833-8e24-6a84350a4bef',
  '44c70169-3740-4609-a57b-b6992c7e0970',
  '9e767f05-2546-4d39-9b54-f2b1b19b378d',
  '8a9995dc-6394-4ef4-92bb-54d4e5c709e0',
  '95259638-c9ea-4b61-a936-1399d59d629f',
  'f050ae49-f1c4-434c-b5a7-d9677f21b88e',
  '704a4fd2-00bb-4796-840f-0cc5ca1e5c30',
  'd31cdbb1-3fc3-4131-9f57-5669fb8a1073',
  'a4496ebd-2dc5-471f-b339-db10c7f44092',
  '220fed07-3e68-4bb0-a5e9-738225d60f32',
  '055047bf-98e4-4efa-b7bf-a11fb78216f6',
  '231692cf-c011-43b6-8ea6-1c4c4b63293f',
  '8a26d185-629a-4c48-9e59-c5c8e32dab24',
  '4c1922e7-64d9-4407-970a-88620af06226',
  '4c410783-bbc0-4157-bac3-c0f5c73284ef',
  '1c9dfd22-ebed-4c0c-809a-84bbc6c6da43',
  '4bc21e83-0e9d-41f3-a948-fd1090a87649',
  'bb0fe62a-1ae3-4f24-8880-251d1cfca20d',
  '69593a09-bccd-4d61-9e6f-ca2c97bb88ba',
  'b79756a3-0370-4a87-a185-552fd3f6af8b',
  '0ab35e1a-a980-4c3f-8c5a-3d05390a64bb',
  'c6ce1228-d7f1-4594-b2a0-ab509f844d24',
  '9650f42f-899e-4a9b-b3ab-c80ec2b6e644',
  '715cdd9c-a861-45eb-a0c2-11969d9bfafa',
  'a63d4151-a946-4c38-9179-0feaf8cdeaf5',
  '305ea145-542c-4736-8d6f-3f9595a025da',
  'a1eaeeed-b8e5-4f97-9eb2-cf0298e8674b',
  '6b053b76-12f4-4642-bbcd-14f53b82915f',
  'defa3c46-27f3-4b17-b389-71efa9b5a6de',
  '729c5d66-1c33-408a-bc52-dba3b5bd5beb',
  'aaa5acef-e0e7-4c15-8f28-c9d699c88e3f',
  'bb4a836b-83db-401c-80c1-05597bf6ea21',
  '84131881-8e8c-4f34-b672-2b34460e6dae',
  'b34b4ecf-637f-4490-bcab-377e866022ea',
  '5e0fac00-e43f-411c-baf1-3bf8ae1ee5ff',
  'bec4ee13-f520-43b3-8f34-3b325dd4c254',
  '27512ceb-60d8-44d0-a48e-30320b828844',
  'a6e17c5d-52ca-449c-9a82-aea4e5156a02',
  '0e216c70-1953-4f04-9c83-89e62399dc2d',
  '044e9aa7-2a60-49fb-8830-ce27e04aaf8c',
  'b9ab69b4-994a-4901-947b-29593a7e17db',
  '3ce625be-4a71-422f-81d0-ed52bfebc7da',
  '66ad4eda-2577-4c0d-b25a-e1876bae4359',
  '6ad78057-317a-448e-9477-d14cb09e1ea8',
  '93dd3d66-1426-4a7d-8193-a904fbca683a',
  'e5c72ecf-982d-4611-99cc-7e4e5e0e36c0',
  '6f67d2d1-dc2f-4d86-a69a-71d4f0c44ed1',
  '4e62cd83-6af0-4de4-984d-f4921dd58c26',
  '6e06b090-03b6-4cfb-800d-76b285ad81fc',
  '1c59265f-994a-4362-997d-9d4a93f2fb0b'
);
```

**Productos (277):**

| ID | Nombre actual | SKU | Stock | Sugerencia |
|---|---|---|---|---|
| `45558de1-2861-401e-8a28-4877a0be7034` | /Deflector P/ventanilla Renault Sandero Duster Oroch Logan 07/12 Delantero | `01614FU` | ? | ⚠️ → "Deflector P/ventanilla Renault Sandero Duster Oroch Logan 07/12 Delantero" *(Leading "/" character)* |
| `cb45d6f1-6386-4351-a840-a22e49b06ac4` | Deflector P / Capot Frontier 2024 En Adelante | `3051` | ? | |
| `45fbd15f-9eea-4bbd-ae28-c2068773a1f8` | Deflector P / Capot Hilux 2021 + ( 03079 ) | `G3079` | ? | |
| `b4c0890b-6366-4fdc-9d41-85a1d5b546a7` | Deflector P/ Ventanilla Chevrolet Captiva Trasero | `01520TA` | ? | |
| `b0112f45-b430-4e29-b0b7-e3b636e58f89` | Deflector P/ Ventanilla Dodge Journey +2011 Delantero | `2003A` | ? | |
| `b963d5b4-d762-4d37-91a3-784a239b6417` | Deflector P/ Ventanilla Fiat Grand Siena Tras Adh | `G1018TA` | ? | |
| `5b76dd5b-87a1-4894-a172-e58c71276505` | Deflector P/ Ventanilla Fiat Nuevo Palio +2012 Delantero | `G1033` | ? | |
| `cab3bed5-859d-4e98-9706-76e3fc58f5a3` | Deflector P/ Ventanilla Ford Ka 2018/... | `G1329` | ? | |
| `f5ef9cf3-aa03-4c38-b460-c72017df099d` | Deflector P/ Ventanilla Renault Kangoo 2018/... Adh | `01627AFU` | ? | |
| `b61609d4-efb9-4882-84dc-f0e6e111cded` | Deflector P/ Ventanilla Vw Up 5ptas Trasero | `01815T` | ? | |
| `58e161b3-537c-42e0-ae88-548ffc2848e1` | Deflector P/capot Amarok 1 Generacion 2011-2024 | `G3032` | ? | |
| `8cb09d67-4cec-4339-a511-b1946627d99e` | Deflector P/capot Chevrolet Corsa Clasicc 2002 En Adelante | `3040` | ? | |
| `b5ce4615-d0a6-4c28-ae98-d5b4265184e2` | Deflector P/capot Chevrolet S10 04 / 08 | `DA-CH-6223` | ? | |
| `be7fff47-df68-4678-af6c-fcf59a940800` | Deflector P/capot Chevrolet S10 2016 / 2020 Trail Blazer 2013 | `3061` | ? | |
| `61836e8d-667b-4b9f-9f4e-1fa9c5995eb9` | Deflector P/capot Chevrolet S10/blazer (Acrilico Largo) Mod.2001 A 2008 | `03017L` | ? | |
| `5b7cf845-f179-4f6c-b1b2-6033a55bb9e0` | Deflector P/capot Corto Ford Ranger 2010 / 2012 | `3028` | ? | |
| `e525f85e-9ca4-4ceb-a89b-ddfeaff943bb` | Deflector P/capot Ecosport Kinetic 2012 / 2017 | `3029` | ? | |
| `410af8dc-36e2-406a-a194-08d38b0dbd36` | Deflector P/capot Fiat Toro 2016 A 2021 | `3077` | ? | |
| `d39737f7-73ef-4894-8d99-a3e4fa9a4164` | Deflector P/capot Ford Ecosport Corto 2003 / 2007 | `3018` | ? | |
| `39d680da-48a6-4d9b-9551-13a53d37f31a` | Deflector P/capot Ford Ecosport Kinetic 2017 Largo | `3053` | ? | |
| `9dd43c45-7cd1-4f74-b32c-a132d1475743` | Deflector P/capot Ford Ecosport Kinetic Corto 2012 / 2016 | `3050` | ? | |
| `c3e308d4-ef51-4c6d-ae46-671da45db4c2` | Deflector P/capot Ford Ranger +16 | `3048` | ? | |
| `c6c3d26d-5d04-4242-a69c-b6444df7d484` | Deflector P/capot Nissan Frontier Mod.2009 / 2015 | `3034` | ? | |
| `13bc6ee5-f3dd-46a0-8769-3fec52855936` | Deflector P/capot Peugeot Partner / Berlingo 2010 /... | `3037` | ? | |
| `de302b02-cd1b-432f-b107-b158e24d467e` | Deflector P/capot Renault Kangoo 2008+ | `3036` | ? | |
| `5324bf68-3bf0-4d79-9e2a-937a43d64762` | Deflector P/capot Toyota Hilux 2001 - 2004 | `3013` | ? | |
| `c1c554ad-55cd-4ec4-8ac1-17f0d149759a` | Deflector P/capot Toyota Hilux 2012 A 2015 | `3023` | ? | |
| `9eddc3f6-7fe0-44d8-a852-7cd92520b0ee` | Deflector P/capot Toyota Hilux 2016 / 2020 | `G3068` | ? | |
| `8734f39c-8664-4f87-99e0-0926d454ce35` | Deflector P/capot Toyota Hilux 2016 / 2020 Negro Largo | `17543` | ? | |
| `87b4fd79-ad54-4fba-8adc-ae55002f7d7b` | Deflector P/capot Vw Amarok 2 Generacion +2024 | `G3093` | ? | |
| `2affb5b5-88e1-4dd6-8408-4adfa5492a14` | Deflector P/capot Vw Cross Fox 04/09 | `3033` | ? | |
| `64247f4b-8a55-43f5-9dff-a67dbfb3a651` | Deflector P/capot Vw Saveiro 2010+/vw Voyage 2008+/vw Gol Trend 2008+ | `3039` | ? | |
| `d62fb652-c020-4a70-ab55-4e1ef9dcdd20` | Deflector P/ventanilla Astra 4/5 Ptas Tras Adh | `01514TA` | ? | |
| `74768376-4675-4b12-affe-a0fc3452f0d4` | Deflector P/ventanilla Chery Tiggo 2008 / 2013 Ad Delantero | `G2800A` | ? | |
| `00bf3db1-a30c-4d4c-b946-6b99aeb7c031` | Deflector P/ventanilla Chery Tiggo 2008 / 2013 Ad Trasero | `G2800TA` | ? | |
| `bcdb0459-b12c-43db-8532-205cf6576ebf` | Deflector P/ventanilla Chery Tiggo Serie 5 Delantero | `02801A` | ? | |
| `8772067b-910b-49b0-982c-a108d9878d04` | Deflector P/ventanilla Chery Tiggo Serie 5 Trasero | `02801TA` | ? | |
| `9523d25e-2be5-469b-b814-fda4575f3994` | Deflector P/ventanilla Chevrolet Astra 2002+ Delantero | `1514` | ? | |
| `5734d003-850c-4141-9235-a608c189c38d` | Deflector P/ventanilla Chevrolet Astra 2002+ Delantero | `01514A` | ? | |
| `3c7f6f1f-755f-429d-adaa-618013d4e25d` | Deflector P/ventanilla Chevrolet Aveo Delantero 2008+ | `1516` | ? | |
| `028c274e-34b2-4ea4-9475-10613da23cbb` | Deflector P/ventanilla Chevrolet Aveo Tras | `01516T` | ? | |
| `6099d2cc-37d1-4eef-8f8c-3b6921c02cbf` | Deflector P/ventanilla Chevrolet Aveo Trasero "A | `DP-CH-6399` | ? | |
| `2d32546c-4481-4be8-a7a3-b34e1b4042f9` | Deflector P/ventanilla Chevrolet Blazer Puertas Traseras (Doble Cabina) Adhesivo 3m | `01510A` | ? | |
| `b4f30eb9-64c5-4513-8c3c-22228bf930c9` | Deflector P/ventanilla Chevrolet Corsa Classic 4p Trasero | `01512T` | ? | |
| `c5a6726a-f7a4-45ad-b83c-549fc0953941` | Deflector P/ventanilla Chevrolet Corsa Classic 4p Trasero Adhesivo | `01512TA` | ? | |
| `3fef8033-01bc-4675-bda3-ae341476cb53` | Deflector P/ventanilla Chevrolet Corsa Ii 4p | `1513` | ? | |
| `470a4159-43a7-4b2c-8012-c86ec589f1cd` | Deflector P/ventanilla Chevrolet Cruze Delantero | `G1524` | ? | |
| `2bafe4c3-24f7-4041-91da-243a07ddaeb5` | Deflector P/ventanilla Chevrolet Cruze Delantero Adhesivo | `DP-CH-6397` | ? | |
| `728b9272-08eb-498d-9030-b14504effcd2` | Deflector P/ventanilla Chevrolet Luv/ Isuzu98-01 | `01509A` | ? | |
| `dd0bdf25-a775-4fb2-957d-e40ea8ba3917` | Deflector P/ventanilla Chevrolet Luv/isuzu (93-97) | `01507A` | ? | |
| `2909bd37-1e1f-4d05-903c-1c217ffdb477` | Deflector P/ventanilla Chevrolet Meriva Ad Delantero | `01501A` | ? | |
| `e7cb7ab2-dade-4586-979d-2a8d405db7f1` | Deflector P/ventanilla Chevrolet Meriva Adh Trasero | `01501TA` | ? | |
| `970d668b-ae7d-4053-ac57-0fb5b11b0706` | Deflector P/ventanilla Chevrolet Meriva Delantero | `1501` | ? | |
| `2d514418-f17d-4427-b64d-145239d8699a` | Deflector P/ventanilla Chevrolet Montana Ad Delantero | `DP-CH-6357DA` | ? | |
| `8433193d-6589-42f9-96bb-a3bae3ae4a81` | Deflector P/ventanilla Chevrolet S10 /Blazer 1997/2011 Del Ad | `01505A` | ? | |
| `9d21c623-5e05-4c41-b501-a9717696c502` | Deflector P/ventanilla Chevrolet S10 +12 / Ford Ranger +12 Adh Delantero | `01518A` | ? | |
| `ffdbe60c-0325-4c52-8ff0-b01dda815d95` | Deflector P/ventanilla Chevrolet S10 +12 / Ford Ranger +12 Dc Delantero | `1518` | ? | |
| `05d97e47-61c8-4fe2-bfb9-27a2ce38cec0` | Deflector P/ventanilla Chevrolet S10 +12 / Ford Ranger +12 Trasero | `01518T` | ? | |
| `83990069-3edf-4c7b-9566-b2577b22a08d` | Deflector P/ventanilla Chevrolet S10 +12 Adh Trasero | `01518TA` | ? | |
| `e77632cd-f191-436b-9349-28078b5a7c81` | Deflector P/ventanilla Chevrolet S10 1997/2011 Ad Trasero | `01506A` | ? | |
| `55b27514-d8ad-4166-83e1-ffeec8727ff2` | Deflector P/ventanilla Chevrolet S10 Trasero | `01506T` | ? | |
| `53def5a4-2913-471c-86dd-baad6de63bbd` | Deflector P/ventanilla Chevrolet S10/blazer +2012 Linea Nueva Cabina Simple Adhesivo "Md | `220` | ? | |
| `f82fba92-a812-490e-b65b-b8556952ab7c` | Deflector P/ventanilla Chevrolet Silverado / Kodiak Adh | `1502` | ? | |
| `67197480-269b-42c0-b3ff-6c04c05fedfb` | Deflector P/ventanilla Chevrolet Sonic Delantero Adhesivo | `DP-CH-6429` | ? | |
| `5fe939be-1454-4529-bec5-4090644f3236` | Deflector P/ventanilla Chevrolet Sonic Trasero | `DP-CH-6430` | ? | |
| `d24b2310-f177-42fa-b3af-9d5fda7edd8f` | Deflector P/ventanilla Chevrolet Spin 12+ | `1521` | ? | |
| `becc512e-1f4f-4b42-81df-18eae182df2b` | Deflector P/ventanilla Chevrolet Spin Trasero | `01521T` | ? | |
| `4a83ec5c-a80f-4630-8332-f38655ca1d57` | Deflector P/ventanilla Chevrolet Tracker Ad Delantero | `G1528A` | ? | |
| `1014413e-bc1d-40e1-b10a-f43b4743e410` | Deflector P/ventanilla Chevrolet Tracker Delantero C/grampa | `G1528` | ? | |
| `a8a94c70-f286-470c-978c-aae990a04e81` | Deflector P/ventanilla Chevrolet Tracker Tras Adh | `G1528TA` | ? | |
| `d6c4b14c-5545-478a-b9d2-6cd7503459a3` | Deflector P/ventanilla Chevrolet Tracker Trasero C/grampa | `G1528T` | ? | |
| `0fb18fb7-6877-4e15-9b7e-bdc14f6ed138` | Deflector P/ventanilla Chevrolet Zafira 2004+ Ad Trasero | `01515TA` | ? | |
| `17eab3f8-7495-4788-8579-7acb1c28bcd4` | Deflector P/ventanilla Citroen C3 4p Delantero | `2500` | ? | |
| `1232dd58-93c0-4c04-9127-e624fd0c7c1d` | Deflector P/ventanilla Citroen C3 Aircross 2011/2017 Adh | `02502A` | ? | |
| `d5a36cce-12e7-43f4-ab18-3b0f8d169498` | Deflector P/ventanilla Citroen C3 Aircross 2011/2017 Adh Tras | `02502TA` | ? | |
| `8530e9d1-1e6a-4cc2-9266-85dbf3a019ba` | Deflector P/ventanilla Citroen C3 Trasero | `02500T` | ? | |
| `03209ba8-96c5-4ebe-9acb-f9323ec03c4e` | Deflector P/ventanilla Citroen C3 Trasero Adh | `02500TA` | ? | |
| `a911d90a-ab97-47dd-944e-bfe43a852146` | Deflector P/ventanilla Citroen C4 Lounge Del | `2504` | ? | |
| `7f4be331-49ed-402e-8092-52c7b3aed742` | Deflector P/ventanilla Dodge Ram 2004+ Ad Delantero | `02001A` | ? | |
| `9b403b3a-aee0-4df3-9579-7ddd602a338e` | Deflector P/ventanilla Fiat 147 Fiorino-spazio-vivace Adhesivo 3m | `01026A` | ? | |
| `365517c6-270f-4f03-b0c8-3a5cf6fde89d` | Deflector P/ventanilla Fiat Argo Del Adh | `1037A` | ? | |
| `76779441-67d3-4438-9b1c-52e267fdf659` | Deflector P/ventanilla Fiat Cronos Delantero Adh | `1038A` | ? | |
| `b55cb002-29f9-4f0a-af83-54cc7ad2df44` | Deflector P/ventanilla Fiat Cronos Trasero Adh | `G1038TA` | ? | |
| `45d4307f-71d8-4f14-8afa-daa5fe7cfc62` | Deflector P/ventanilla Fiat Doblo Strada +2006 | `01043A` | ? | |
| `3b6ed37d-42b6-4bbd-b8c2-c720319b6f83` | Deflector P/ventanilla Fiat Ducato Largo Adhesivo "Md | `171` | ? | |
| `c54ec7a6-444f-4d43-9c8d-edef2af14e65` | Deflector P/ventanilla Fiat Ducato/boxer 1995/2017 | `1004` | ? | |
| `dc00220a-4211-463c-b3d8-c0aee6cbf7e4` | Deflector P/ventanilla Fiat Duna -Uno-fiorino Trasero | `01011TA` | ? | |
| `3d82514c-2777-4a84-ad66-3fd711d155f6` | Deflector P/ventanilla Fiat Duna-uno 5p -Fiorino Ad Delantero | `01011A` | ? | |
| `d14691d8-0f9d-4a8c-85f6-8c2745a8eb9f` | Deflector P/ventanilla Fiat Fiorino + 2017 Espejo Libre | `01038FU` | ? | |
| `db8f22dd-6c9c-490e-ba3c-a6f557ecf530` | Deflector P/ventanilla Fiat Fiorino +2014 Espejo Entero | `1039` | ? | |
| `d1cb8ebe-4999-4bc8-82b3-aaa80905e642` | Deflector P/ventanilla Fiat Fiorino +2015 Delantero Adhesivo | `G1035A` | ? | |
| `281fdd04-9746-424b-8a2d-698c7ce07eae` | Deflector P/ventanilla Fiat Gran Siena +2013 Trasero Adhesivo "Md | `123` | ? | |
| `15ca461c-af04-4478-8bba-01a7ccf3348d` | Deflector P/ventanilla Fiat Gran Siena Delantero Adh | `G1018A` | ? | |
| `0825faab-8ffb-4264-a462-95ac438d5f85` | Deflector P/ventanilla Fiat Idea Delantero | `1025` | ? | |
| `3bb3913c-0001-4fbc-8c2c-0e7f2b9cd160` | Deflector P/ventanilla Fiat Iveco Turbo Daily 2100 Ad | `01030A` | ? | |
| `f8b087ba-301e-4dba-b7cc-21afb7433302` | Deflector P/ventanilla Fiat Nuevo Uno Attractive 5p 2010+/sporting 5p 2010+ / Way 5p 2010+ Delantero | `1028` | ? | |
| `6db14d96-6b64-4a20-a103-ab0625714e76` | Deflector P/ventanilla Fiat Nuevo Uno Attractive 5p 2010+/sporting 5p 2010+/way 5p 2010+ Espejo Libre | `1029` | ? | ⚠️ *Requiere renombre manual (nombre >100 caracteres)* |
| `3c2f7458-9b5b-47d5-a48b-f68b9023979a` | Deflector P/ventanilla Fiat Palio 2012 + Delantero | `1033` | ? | |
| `a0d939b6-355d-4dc2-89ec-eeb39e537f91` | Deflector P/ventanilla Fiat Palio 3p | `1022` | ? | |
| `265aba49-30bc-49d4-9f80-03ce50aef43f` | Deflector P/ventanilla Fiat Punto Delantero | `1023` | ? | |
| `64899498-e047-4157-897f-460d1f5e7ed5` | Deflector P/ventanilla Fiat Qubo | `1035` | ? | |
| `485db360-8e47-49b8-877b-9187fdfc2a23` | Deflector P/ventanilla Fiat Siena / Palio 4p (Esp Libre) 97/07 Delantero | `1027` | ? | |
| `276e1363-8def-4988-8020-b34c1e374edb` | Deflector P/ventanilla Fiat Siena / Palio 5 Ptas 97/07 / Adventure Ad Trasero | `01014TA` | ? | |
| `3f18091c-b763-4ac7-b488-ce34312bd8a6` | Deflector P/ventanilla Fiat Siena / Palio 5 Ptas 97/07 / Adventure Trasero | `01014T` | ? | |
| `62561352-96ed-4cde-94ca-ef3171a3bc14` | Deflector P/ventanilla Fiat Siena/palio 5p Delantero Adhesivo "Md | `117` | ? | |
| `f265ad8d-010e-4cfd-8ab1-b1d9adc2c91b` | Deflector P/ventanilla Fiat Siena/palio 5p Trasero Adhesivo "Md | `118` | ? | |
| `7cb2e3f6-c72a-4bf6-acbf-e491abe40e6d` | Deflector P/ventanilla Fiat Strada 2006/… Espejo Entero | `1032` | ? | |
| `177ad7d0-a5c6-45c8-ae99-246d69570662` | Deflector P/ventanilla Fiat Toro Ad Trasero | `1036TA` | ? | |
| `85bd9620-3f46-4ff5-bf6c-3f356df6138b` | Deflector P/ventanilla Fiat Uno 3p Fire | `1020` | ? | |
| `0ecbbefc-8552-427e-98bc-e99fc70bf8a2` | Deflector P/ventanilla Fiat Uno 3p Fire | `01020A` | ? | |
| `bf93c952-f33f-4dd2-bdb7-b8935239a8fd` | Deflector P/ventanilla Fiat Uno 4ptas 2011 Ad Delantero | `DP-FI-0535DA` | ? | |
| `e1cfa585-e4b7-4936-aa3a-221c03fb259f` | Deflector P/ventanilla Fiat Uno Attractive Tras | `01029T` | ? | |
| `07d8a912-6525-40a4-ae0d-87332b52c9f2` | Deflector P/ventanilla Ford 7000 / 14000 | `1302` | ? | |
| `cc9ddd88-1eef-438a-b301-cc109ccd3cc7` | Deflector P/ventanilla Ford 7000 74/80 | `1301` | ? | |
| `c8c42a13-13f2-4796-9c3d-0ef0fc0f499b` | Deflector P/ventanilla Ford Courier Pick Up 05+/fiesta 3p 96/02 | `1327` | ? | |
| `1995e923-b2e9-404a-8334-f1651d884c16` | Deflector P/ventanilla Ford Ecosport 2003/2012 Ad Trasero | `01317A` | ? | |
| `25d38ec1-7285-43fe-8317-d912f167cf8f` | Deflector P/ventanilla Ford Ecosport Kinetic 2013 Ad Trasero | `01330TA` | ? | |
| `d15bf7c2-b96e-4f97-867a-fc6a296e4d8d` | Deflector P/ventanilla Ford Ecosport Kinetic 2015+ Cromado Juego X4 | `DB-1330CC` | ? | |
| `a31c37aa-d001-4217-9991-f805c6ff63e7` | Deflector P/ventanilla Ford Ecosport Trasero | `1317` | ? | |
| `4122e1cf-3d94-4c32-a625-9bb301ef3f94` | Deflector P/ventanilla Ford Escort (Linea Nueva) Orion 94-97 | `1314` | ? | |
| `23163b31-4212-4f50-beb2-cee46959c359` | Deflector P/ventanilla Ford F100 Hasta 1999 Y F100 Duty 99/07 Ad Trasero | `1322F` | ? | |
| `85ed9229-1dd8-446f-be17-d2c6de0844d0` | Deflector P/ventanilla Ford Fiesta 4p/courier Delantero | `1308` | ? | |
| `cc82d4d2-216f-4957-bcad-676074400865` | Deflector P/ventanilla Ford Fiesta Kinetic Ad Delantero | `01320A` | ? | |
| `60f2dec4-8093-4e81-8be3-df8a2d392779` | Deflector P/ventanilla Ford Fiesta Kinetic Ad Trasero | `01320TA` | ? | |
| `78a1d6dd-55f5-4d91-b7f5-102d4eb7ff59` | Deflector P/ventanilla Ford Fiesta Max Ad Delantero | `01323A` | ? | |
| `077fdfef-a9ea-4251-bce7-ac7cba054842` | Deflector P/ventanilla Ford Fiesta Max Ad Trasero | `01323TA` | ? | |
| `18a14ed7-c52c-41b3-b624-68be01d334c3` | Deflector P/ventanilla Ford Fiesta Max Delantero | `1323` | ? | |
| `3625f826-9cb2-47ab-a0a5-bda421504dfc` | Deflector P/ventanilla Ford Fiesta Max Trasero | `01323T` | ? | |
| `e3bf871a-d597-408b-a858-c57fcd0e5473` | Deflector P/ventanilla Ford Focus Delantero | `1324` | ? | |
| `f3dd7181-c68d-4909-bd17-6a67f54f9127` | Deflector P/ventanilla Ford Focus Trasero Adhesivo | `DP-FO-2097TA` | ? | |
| `3fa20df3-3abc-4bae-818d-cd3333e32e7a` | Deflector P/ventanilla Ford Ka 2008 Delantero | `1326` | ? | |
| `85fedfe8-9fe7-42eb-a6c7-ff5326797353` | Deflector P/ventanilla Ford Ka 2016 Delantero | `1331` | ? | |
| `a4ee47af-1edb-40e5-9d68-4513cb44f57d` | Deflector P/ventanilla Ford Ka 97/07 Delantero | `1325` | ? | |
| `bf70eb85-1a49-45b2-b926-493597156ac4` | Deflector P/ventanilla Ford Ranger +12 Ad Delantero | `01318A` | ? | |
| `fa9fd49d-5d72-41b5-9ff4-e08d2486712d` | Deflector P/ventanilla Ford Ranger +12 Trasero | `01318TA` | ? | |
| `2a9332f3-cccf-4b03-ab39-daa9af0f0a88` | Deflector P/ventanilla Ford Ranger 08 / 11 Trasero | `1311` | ? | |
| `4d853ed8-ca1b-4b0e-bc38-dcdc8e61d896` | Deflector P/ventanilla Ford Ranger 2005-2012 Delantero Adhesivo "Md | `142` | ? | |
| `0c7445fe-886e-46d5-ba06-905f74223c27` | Deflector P/ventanilla Ford Ranger 2012+ Cromado Juego X4 | `DB-1318CC` | ? | |
| `f6a81c33-7636-49d4-a4c4-76d1dbe560b9` | Deflector P/ventanilla Ford Ranger 98/11 Ad Delantero | `01310A` | ? | |
| `e492437f-31b1-450f-bd18-a06cb72322fd` | Deflector P/ventanilla Ford Transit 96/00 Delantero | `1300` | ? | |
| `f397ade2-5013-47d2-a4b2-3d3399322c57` | Deflector P/ventanilla Ford Transit Mod.nuevo Delantero | `1306` | ? | |
| `6ae531a5-b4e2-4a91-bffa-3414c44691d1` | Deflector P/ventanilla Hilux +2016 Delantero | `G2130A` | ? | |
| `41bd1cb9-50be-41a5-b25c-bcae868afb2a` | Deflector P/ventanilla Hilux +2016 Trasero | `G2130TA` | ? | |
| `c74f6d50-7447-4f44-92ca-593943c98dd9` | Deflector P/ventanilla Honda Fit 2008/2013 Delantero | `2200` | ? | |
| `b315a89f-6328-40ed-8693-1061b00d29d7` | Deflector P/ventanilla Honda Fit 2008/2013 Trasero | `02200T` | ? | |
| `4e743f0c-532d-4302-b02c-57f9d4b64a73` | Deflector P/ventanilla Honda Fit 2009 / 2016 C/grampa | `G2900` | ? | |
| `1932df9a-f8dd-4d37-bf16-483ab94f1a69` | Deflector P/ventanilla Jeep Renegade +2016 Del Adh | `02600A` | ? | |
| `9a6426a8-f530-4f6f-86bc-38f1272c6b44` | Deflector P/ventanilla Jeep Renegade +2016 Trasero Adh | `02600TA` | ? | |
| `82bac057-86e7-4f4f-bb33-3883c2c24af5` | Deflector P/ventanilla Kia Sorrento Ad Delantero | `02701A` | ? | |
| `ac21dd0a-0047-4284-8d27-19f998b5c0ff` | Deflector P/ventanilla Kia Sorrento Ad Trasero | `02701TA` | ? | |
| `cd2e8786-7e2b-4ec3-90c3-2e911b78af13` | Deflector P/ventanilla Lifan X60 Delantero Adhesivo "Md | `225` | ? | |
| `881ae8af-efdd-418a-9110-ce2c32abfd3c` | Deflector P/ventanilla Lifan X60 Trasero Adhesivo "Md | `226` | ? | |
| `e76b8236-153d-49ae-9cb7-0f9e555f32ff` | Deflector P/ventanilla Mercedes Benz Sprinter 07 / 16 | `1200` | ? | |
| `75b7b154-54e3-4b5e-836a-6002855b6d65` | Deflector P/ventanilla Mercedes Benz Sprinter Delantero Adh (Envolv.) | `01200E` | ? | |
| `76484da1-8e6d-4bb8-b3b2-8961c43ba44c` | Deflector P/ventanilla Mercedes Benz Vito Van | `G1230A` | ? | |
| `1c0513ac-945b-4756-b4ef-a0ca7706a0ee` | Deflector P/ventanilla Nissan Frontier 2009+ Ad Delantero | `02301A` | ? | |
| `7cf28aef-7187-4f53-82a7-78169272b3a2` | Deflector P/ventanilla Nissan Frontier 2010+ Ad Trasero | `02301TA` | ? | |
| `8955537b-22b8-430b-b9fe-c56007e3073d` | Deflector P/ventanilla Nissan Frontier 2013/2016 Delantero Adhesivo "Md | `229` | ? | |
| `11001c7d-2a34-4afa-ace6-194d43700f55` | Deflector P/ventanilla Nissan Frontier Adh +2016 | `02302A` | ? | |
| `998a2eed-9dee-4e1f-b2c5-97262805eff4` | Deflector P/ventanilla Nissan Frontier Adh Trasero +2016 | `2302TA` | ? | |
| `660d62d9-d647-4020-a39f-3ca4ae201485` | Deflector P/ventanilla Partner/berlingo +2007 Adh | `01702A` | ? | |
| `b68a0377-a188-413f-8a15-bca752d70c8c` | Deflector P/ventanilla Peugeot 206 3p | `1705` | ? | |
| `2e0358cc-2924-4ff2-badb-b8e6cfde9121` | Deflector P/ventanilla Peugeot 206 5p (99 Al 09) Ad Delantero | `01706A` | ? | |
| `ea6452c3-89bc-47cc-8433-6d95f0411385` | Deflector P/ventanilla Peugeot 206 5p 99al09 Ad Trasero | `01706TA` | ? | |
| `ec5ae2d0-4253-47d4-a47c-6aa9f3ef87bf` | Deflector P/ventanilla Peugeot 207 3p 2008+ | `1708` | ? | |
| `841c1c2e-ebbc-4af9-9997-507fcb34effa` | Deflector P/ventanilla Peugeot 207 4/5 Ptas Trasero | `01707T` | ? | |
| `c37dd9e3-a0c3-4a56-ba17-a0a08545400b` | Deflector P/ventanilla Peugeot 208 +2013 Del | `1714` | ? | |
| `051e3f9b-fd78-4a7a-8453-aea2e217449c` | Deflector P/ventanilla Peugeot 306 4-5 Delantero "A | `DP-PE-3316` | ? | |
| `5eb516fd-a5e9-4a3e-9e90-743c60c38aa4` | Deflector P/ventanilla Peugeot 306 Delantero | `1704` | ? | |
| `ff87aec6-0399-4527-9f7f-96c1cd158471` | Deflector P/ventanilla Peugeot 306 Delantero Adh | `01704A` | ? | |
| `83bbccd9-2a2e-450f-87b8-8882d0998471` | Deflector P/ventanilla Peugeot 307 5 P Ad Trasero | `01709TA` | ? | |
| `a3bb8f7c-a677-42e9-a758-b00855abbb89` | Deflector P/ventanilla Peugeot 307 5p Ad Delantero | `01709A` | ? | |
| `e68024f5-52d5-4a96-b2e1-d7abb549dcab` | Deflector P/ventanilla Peugeot 307 5p Delantero | `1709` | ? | |
| `62269121-0f56-4fad-8751-133550020309` | Deflector P/ventanilla Peugeot 308 Ad Delantero | `01713A` | ? | |
| `88eb4263-b76e-4dd5-8105-0c1e647a54a4` | Deflector P/ventanilla Peugeot 308 Ad Trasero | `01713TA` | ? | |
| `d9db10b8-d990-475b-ad45-52d9fb9b4e55` | Deflector P/ventanilla Peugeot 408 2011+ Delantero | `1712` | ? | |
| `b3b41d90-84e1-4a3f-9c57-3e2f7cbe59a4` | Deflector P/ventanilla Peugeot 504 (Auto) Ad Delantero | `01701A` | ? | |
| `15f6be3e-e575-48d0-abbd-1f6c80a681d0` | Deflector P/ventanilla Peugeot 504 Pick Up Ad Delantero | `01700A` | ? | |
| `f003abbf-7eae-41e0-a80d-c3e65a9b0648` | Deflector P/ventanilla Renault 12 Dacia | `1612` | ? | |
| `3ae1ab25-6718-4fe5-84a3-2213c86eb594` | Deflector P/ventanilla Renault 18 Delantero | `1611` | ? | |
| `2470eb1a-7024-4e2f-88be-2336c8f5237d` | Deflector P/ventanilla Renault 9 / 11 Delantero | `1602` | ? | |
| `782adb1a-0bf2-49d6-bcc0-5a396847c46a` | Deflector P/ventanilla Renault Captur Ad Trasero | `G1628TA` | ? | |
| `ac08e12c-ad4c-4708-bc7e-b67c993dd550` | Deflector P/ventanilla Renault Clio 94/98 Delantero | `1605` | ? | |
| `eea66cf3-2c41-495d-b1d6-d1a0853ec2cf` | Deflector P/ventanilla Renault Clio2 2p (00/07) | `1608` | ? | |
| `b0567ed0-e1d6-4b11-b492-5f5847dd4dfd` | Deflector P/ventanilla Renault Duster 2011+ Trasero | `1623` | ? | |
| `d2d657a9-270e-44eb-8161-b4e95e793a27` | Deflector P/ventanilla Renault Duster Delantero + 2011 Adh | `01623A` | ? | |
| `2748ce6b-a3ac-47f9-a616-b010074d49f6` | Deflector P/ventanilla Renault Duster Trasero Adhesivo "Md | `41` | ? | |
| `9f23cd2f-9b9c-4abd-8e9e-c8a586ddf80f` | Deflector P/ventanilla Renault Express Ad Delantero | `01601A` | ? | |
| `6e7949e4-e07b-4eb4-8396-30f02947c583` | Deflector P/ventanilla Renault Fluence +10 Trasero | `01624T` | ? | |
| `b4fa3ea1-4728-46a8-8427-7f4e6d1ef559` | Deflector P/ventanilla Renault Fluence 2010 En Delantero | `1624` | ? | |
| `5c3e2ab9-6652-4227-9e65-1eb1322492c1` | Deflector P/ventanilla Renault Fluence Trasero Adhesivo "Md | `44` | ? | |
| `512bf026-13c4-4506-a4a7-1c6e30d71276` | Deflector P/ventanilla Renault Kangoo Delantero | `1621` | ? | |
| `f45e5269-f526-425a-a42c-a626cae5034a` | Deflector P/ventanilla Renault Kwid Del | `1616` | ? | |
| `33e67103-49a3-4bc1-84d1-ab466fb6178e` | Deflector P/ventanilla Renault Kwid Delantero Adh | `01630A` | ? | |
| `1f4863c6-58d8-4ecb-89d5-be7c7da75ad0` | Deflector P/ventanilla Renault Kwid Trasero Adh | `G1630TA` | ? | |
| `ddcc5c19-4c76-4f25-b8f5-46e04805c76b` | Deflector P/ventanilla Renault Logan +2013 Esp Libre Delantero | `1626` | ? | |
| `46c09b79-ac72-4824-91f6-9ff798e8d3b9` | Deflector P/ventanilla Renault Logan +2013 Trasero | `01626TFU` | ? | |
| `7054c4fc-00e2-4e00-aec7-2fcda8ccd983` | Deflector P/ventanilla Renault Logan +2014 Espejo Entero | `01625FU` | ? | |
| `4a41f7ef-a103-4db0-9cd4-883bed64d25c` | Deflector P/ventanilla Renault Logan 2013+ Delantero Con Grampa | `1625` | ? | |
| `03bc3682-16ce-429e-9420-e0d151292f3c` | Deflector P/ventanilla Renault Logan Delantero | `1622` | ? | |
| `604d83ec-7658-432d-b8fc-cc348f27303f` | Deflector P/ventanilla Renault Master +2011 | `1619` | ? | |
| `b9eadc1c-dfad-42e5-81f4-e7b8dfe1bb95` | Deflector P/ventanilla Renault Master 99 / 10 | `1609` | ? | |
| `176ec189-8221-480b-9eeb-4cd7cad75c42` | Deflector P/ventanilla Renault Megane 2 Delantero | `1617` | ? | |
| `d866c57f-f97f-4db4-a5a0-7d675d98d78a` | Deflector P/ventanilla Renault Megane Trasero | `01610T` | ? | |
| `fb6f52c6-c62f-400e-9ba3-20354d6547fa` | Deflector P/ventanilla Renault R19 88 A 94 Delantero | `1603` | ? | |
| `2e1391eb-efc3-4238-a621-466b12529703` | Deflector P/ventanilla Renault Sandero / Stepway Ad Trasero | `01614TA` | ? | |
| `f7df3e16-1a70-432c-8d49-ac15c7360e06` | Deflector P/ventanilla Renault Sandero Stepway +2014 Con Grampa Trasero | `G1626T` | ? | |
| `c15f7973-c542-4828-927b-c49e161e8f1e` | Deflector P/ventanilla Renault Sandero Stepway +2014 Trasero | `01626TA` | ? | |
| `ac16de30-a0fa-4cbc-8909-050fbaad926f` | Deflector P/ventanilla Renault Scenic 98+ Ad Delantero | `01618A` | ? | |
| `d1662033-da84-404c-af76-eb891bcc08f8` | Deflector P/ventanilla Renault Scenic 98+ Ad Trasero | `01618TA` | ? | |
| `3d4bf0cb-0dfc-42ff-a42c-061f175ba1e9` | Deflector P/ventanilla Renault Symbol Ad Delantero | `DP-RE-4472` | ? | |
| `34c732dc-ed41-4bf4-bb26-068695695d91` | Deflector P/ventanilla Renault Symbol Delantero | `1615` | ? | |
| `04b3963d-2c9c-4e67-9189-e82258aeac3f` | Deflector P/ventanilla Renault Traffic | `1600` | ? | |
| `e17cd6ec-a1c1-462d-8d85-d8cd47412b6b` | Deflector P/ventanilla Renault Traffic Envolvente Adh | `01600EFU` | ? | |
| `c47214d4-76a3-47de-ba70-7666ccf93b71` | Deflector P/ventanilla Suzuki Fun 4p Delantero | `2401` | ? | |
| `5052f7e1-a21b-402d-8d5a-4c66cdfa7708` | Deflector P/ventanilla Toyota Corolla +08 Delantero Adh | `02151A` | ? | |
| `670d74d0-79f6-4637-bf8c-bd21fcc780c1` | Deflector P/ventanilla Toyota Corolla 02 / 07 Delantero | `2150` | ? | |
| `589320f9-b63b-48cb-9b9c-8fc261388235` | Deflector P/ventanilla Toyota Corolla 02/07 Trasero | `02150T` | ? | |
| `f8b7e672-9667-47a8-9055-a1c6c16b4c78` | Deflector P/ventanilla Toyota Corolla 08 Trasero Adh | `02151TA` | ? | |
| `c0ac3f2d-0008-48d1-a119-f6c3d129ef27` | Deflector P/ventanilla Toyota Corolla 2016 Ad Delantero | `G2152A` | ? | |
| `4c902596-0c8c-4de4-9473-e029358ff818` | Deflector P/ventanilla Toyota Etios +14 Adh Tras | `G2120T` | ? | |
| `bef6190b-06aa-4f58-83b9-d4c6a5bdcf3a` | Deflector P/ventanilla Toyota Etios 4/5 Ptas Ad Delantero | `DP-TO-7501` | ? | |
| `35d15d03-d23a-436f-b48d-1f68c986d9d0` | Deflector P/ventanilla Toyota Hilux (Linea Vieja) 95/99 Ad Delantero | `02100A` | ? | |
| `de82830d-2ae6-4006-b702-1df6f2e491ea` | Deflector P/ventanilla Toyota Hilux 05/...d/cab. Ad Delantero | `02109A` | ? | |
| `1868fa96-b494-4ab1-8299-1e2ad42673ce` | Deflector P/ventanilla Toyota Hilux 16> Ad Delantero | `02113A` | ? | |
| `6ecf4d0b-15cd-4a91-97e0-593e37587bec` | Deflector P/ventanilla Toyota Hilux 16> Ad Trasero | `02113TA` | ? | |
| `3364d1e2-e960-4110-b0ba-4dfe35e7dd2a` | Deflector P/ventanilla Toyota Hilux 2000 / 2004 D/cab Trasero | `2106` | ? | |
| `f936d49f-6a1d-4833-8e24-6a84350a4bef` | Deflector P/ventanilla Toyota Hilux 2000 / 2004 Ptas Ad Trasero | `02106A` | ? | |
| `44c70169-3740-4609-a57b-b6992c7e0970` | Deflector P/ventanilla Toyota Hilux 2001/2 Pick Up Cabina Simple Ad | `02107A` | ? | |
| `9e767f05-2546-4d39-9b54-f2b1b19b378d` | Deflector P/ventanilla Toyota Hilux 2002 Doble Cab Ad Delantero | `02105A` | ? | |
| `8a9995dc-6394-4ef4-92bb-54d4e5c709e0` | Deflector P/ventanilla Toyota Hilux 2002 Doble Cab. Delantero | `2105` | ? | |
| `95259638-c9ea-4b61-a936-1399d59d629f` | Deflector P/ventanilla Toyota Hilux 2005 2015 D/c Cromado Juego X4 | `DB-2109CC` | ? | |
| `f050ae49-f1c4-434c-b5a7-d9677f21b88e` | Deflector P/ventanilla Toyota Hilux 2005 2015 D/c Negro Juego X4 | `DB-2109CN` | ? | |
| `704a4fd2-00bb-4796-840f-0cc5ca1e5c30` | Deflector P/ventanilla Toyota Hilux 2005 A 2015 Doble Cabina Ad Trasero | `02110A` | ? | |
| `d31cdbb1-3fc3-4131-9f57-5669fb8a1073` | Deflector P/ventanilla Toyota Hilux 2005 Pick Up Cabina Simple | `2108` | ? | |
| `a4496ebd-2dc5-471f-b339-db10c7f44092` | Deflector P/ventanilla Toyota Hilux 2005 Trasero | `02110T` | ? | |
| `220fed07-3e68-4bb0-a5e9-738225d60f32` | Deflector P/ventanilla Toyota Hilux 2016 En Adelante Juego X4 | `DB-2113CN` | ? | |
| `055047bf-98e4-4efa-b7bf-a11fb78216f6` | Deflector P/ventanilla Toyota Hilux 2016+ Cromado Juego X4 | `DB-2113CC` | ? | |
| `231692cf-c011-43b6-8ea6-1c4c4b63293f` | Deflector P/ventanilla Toyota Hilux 95-99 Trasero Adhesivo | `2101` | ? | |
| `8a26d185-629a-4c48-9e59-c5c8e32dab24` | Deflector P/ventanilla Toyota Sw4 2000/2003 Ad Trasero | `02104TA` | ? | |
| `4c1922e7-64d9-4407-970a-88620af06226` | Deflector P/ventanilla Toyota Sw4 Nva 00/03 Ad Delantero | `2103` | ? | |
| `4c410783-bbc0-4157-bac3-c0f5c73284ef` | Deflector P/ventanilla Toyota Yaris Trasero Adh | `2121TA` | ? | |
| `1c9dfd22-ebed-4c0c-809a-84bbc6c6da43` | Deflector P/ventanilla Vw Amarok 2010+ Ad Delantero | `1830A` | ? | |
| `4bc21e83-0e9d-41f3-a948-fd1090a87649` | Deflector P/ventanilla Vw Amarok 2010+ Con Grampa Trasero | `G1830T` | ? | |
| `bb0fe62a-1ae3-4f24-8880-251d1cfca20d` | Deflector P/ventanilla Vw Amarok 2010+ Trasero Ad | `1830TA` | ? | |
| `69593a09-bccd-4d61-9e6f-ca2c97bb88ba` | Deflector P/ventanilla Vw Amarok 2012 + Con Grampa Delantero | `G1830` | ? | |
| `b79756a3-0370-4a87-a185-552fd3f6af8b` | Deflector P/ventanilla Vw Amarok Cabina Doble Delantero Adhesivo "Md | `209` | ? | |
| `0ab35e1a-a980-4c3f-8c5a-3d05390a64bb` | Deflector P/ventanilla Vw Amarok Cabina Simple Adhesivo "Md | `211` | ? | |
| `c6ce1228-d7f1-4594-b2a0-ab509f844d24` | Deflector P/ventanilla Vw Amarok Delantero | `1830` | ? | |
| `9650f42f-899e-4a9b-b3ab-c80ec2b6e644` | Deflector P/ventanilla Vw Amarok Trasero | `01830T` | ? | |
| `715cdd9c-a861-45eb-a0c2-11969d9bfafa` | Deflector P/ventanilla Vw Bora Delantero | `1809` | ? | |
| `a63d4151-a946-4c38-9179-0feaf8cdeaf5` | Deflector P/ventanilla Vw Camion (Todos) | `1801` | ? | |
| `305ea145-542c-4736-8d6f-3f9595a025da` | Deflector P/ventanilla Vw Fox 3p | `1805` | ? | |
| `a1eaeeed-b8e5-4f97-9eb2-cf0298e8674b` | Deflector P/ventanilla Vw Fox 5 Ptas Trasero | `01806T` | ? | |
| `6b053b76-12f4-4642-bbcd-14f53b82915f` | Deflector P/ventanilla Vw Fox/suran 4 Ptas.ad Trasero | `DP-VW-5508` | ? | |
| `defa3c46-27f3-4b17-b389-71efa9b5a6de` | Deflector P/ventanilla Vw Fox/suran Tras 2004+ Ad Trasero | `01806TA` | ? | |
| `729c5d66-1c33-408a-bc52-dba3b5bd5beb` | Deflector P/ventanilla Vw Gol 3p (Mod. Nuevo) | `1803` | ? | |
| `aaa5acef-e0e7-4c15-8f28-c9d699c88e3f` | Deflector P/ventanilla Vw Gol 3p 2000+ Ad | `01803A` | ? | |
| `bb4a836b-83db-401c-80c1-05597bf6ea21` | Deflector P/ventanilla Vw Gol 4p Mod.nuevo/country Ad Trasero | `01804TA` | ? | |
| `84131881-8e8c-4f34-b672-2b34460e6dae` | Deflector P/ventanilla Vw Gol L/nueva 5 Puertas Ad Delantero | `01804A` | ? | |
| `b34b4ecf-637f-4490-bcab-377e866022ea` | Deflector P/ventanilla Vw Golf 4p Delantero | `1810` | ? | |
| `5e0fac00-e43f-411c-baf1-3bf8ae1ee5ff` | Deflector P/ventanilla Vw Polo +2018 5 Ptas | `G1816A` | ? | |
| `bec4ee13-f520-43b3-8f34-3b325dd4c254` | Deflector P/ventanilla Vw Polo +2018 Trasero | `G1816TA` | ? | |
| `27512ceb-60d8-44d0-a48e-30320b828844` | Deflector P/ventanilla Vw Polo/caddy Delantero | `1800` | ? | |
| `a6e17c5d-52ca-449c-9a82-aea4e5156a02` | Deflector P/ventanilla Vw Saveiro - Trend 3p+2013 | `1816` | ? | |
| `0e216c70-1953-4f04-9c83-89e62399dc2d` | Deflector P/ventanilla Vw Saveiro / Trend 10/12 | `1813` | ? | |
| `044e9aa7-2a60-49fb-8830-ce27e04aaf8c` | Deflector P/ventanilla Vw Saveiro / Trend 10/12 Espejo Libre | `01807FU` | ? | |
| `b9ab69b4-994a-4901-947b-29593a7e17db` | Deflector P/ventanilla Vw Saveiro 2010 - 2016 Gol Trend | `01813A` | ? | |
| `3ce625be-4a71-422f-81d0-ed52bfebc7da` | Deflector P/ventanilla Vw T-cross Delantero Adh | `01822A` | ? | |
| `66ad4eda-2577-4c0d-b25a-e1876bae4359` | Deflector P/ventanilla Vw T-cross Trasero Adh | `01822TA` | ? | |
| `6ad78057-317a-448e-9477-d14cb09e1ea8` | Deflector P/ventanilla Vw Up 3 Ptas Coliza | `G1815` | ? | |
| `93dd3d66-1426-4a7d-8193-a904fbca683a` | Deflector P/ventanilla Vw Up 4 Ptas Ad Trasero | `DP-VW-5561TA` | ? | |
| `e5c72ecf-982d-4611-99cc-7e4e5e0e36c0` | Deflector P/ventanilla Vw Vento +2013 | `G1840` | ? | |
| `6f67d2d1-dc2f-4d86-a69a-71d4f0c44ed1` | Deflector P/ventanilla Vw Virtus +2018 Delantero Adh | `01818A` | ? | |
| `4e62cd83-6af0-4de4-984d-f4921dd58c26` | Deflector P/ventanilla Vw Virtus +2018 Trasero Adh | `01818TA` | ? | |
| `6e06b090-03b6-4cfb-800d-76b285ad81fc` | Deflector P/ventanilla Vw Voyage / Trend 4 Ptas Trasero | `01811T` | ? | |
| `1c59265f-994a-4362-997d-9d4a93f2fb0b` | Deflector P/ventanilla Vw Voyage / Trend 4 Ptas Trasero Adh | `G1811TA` | ? | |

| **SQL — Renombrar productos** |
|---|---|
```sql
UPDATE product SET name = 'Deflector P/ventanilla Renault Sandero Duster Oroch Logan 07/12 Delantero' WHERE id = '45558de1-2861-401e-8a28-4877a0be7034';
```
⚠️ *1 producto(s) requieren renombre manual (nombres muy largos >100 caracteres)*

---

### 2. Iluminación

**SQL — Crear categoría:**
```sql
INSERT INTO category (id, name, description, color, "sortOrder", "isActive")
VALUES ('cat-iluminacion', 'Iluminación', 'Focos LED, halógenos, lámparas, kits de iluminación, DRL, tiras LED, ojos de ángel', '#F59E0B', 2, true);
```

**SQL — Asignar productos a esta categoría:**
```sql
UPDATE product SET "categoryId" = 'cat-iluminacion' WHERE id IN (
  '18ec4c03-d174-4238-8ba7-f399e5c9cbc8',
  'bfcf3f45-c5af-4b1e-bb6e-046c49575695',
  '6019ac60-511a-4f1e-9288-0919f35d9bc8',
  'ad8b0239-edb5-4863-985b-7f6cfd949905',
  'ad09a401-1fb6-4250-befb-a5391d829a00',
  'f43ea568-ac85-4769-bd61-0c193cf3be74',
  '82477d4c-2092-4343-8fa4-0e64f80a5215',
  '912de260-fdeb-4e68-83d6-6340178c6918',
  'cfdd3978-29b0-4189-9490-9ccb9719fba5',
  '06b312b4-6c21-436c-820e-b598c8744b56',
  '10a493c5-fc34-431e-a634-49235e459b56',
  '0e6badff-17e9-41dd-bd4e-5455a4173033',
  '2a8a24dc-8ddf-4aec-9a74-6979eb1f56b3',
  'd9c6d98f-5a42-4bb2-88c9-c3ed55a81ae2',
  '51b2e0da-4891-4d27-a031-e9ef5cd67adf',
  '783aad47-9f5b-4043-8a4a-eefa6a55f2af',
  'a1c2416e-cd88-4b89-a0d6-37927ff02835',
  'prod-1782142384070-fgvjbf7my',
  'af212d80-ae72-401a-ab63-bb68d201dca0',
  '31b81c42-f864-4c79-b398-14226b9d926f',
  'f2aff8fb-06d3-4ab4-b93e-eec89c3c3113',
  'prod-1779394822684-c8s21ncx9',
  '00f4a2c7-cab9-4ea1-b2dd-10a8c94218f2',
  '51a7ccf8-85d7-48af-9583-2e2b3180e515',
  'd4dee4ae-e33c-462e-bb67-7db7cf807548',
  '4c2ecb8d-6dda-4b4b-a79b-99cc3a2ac0d6',
  'f7cc2d6f-500f-46dd-b58d-95890bfc10ae',
  '24c7049c-c685-45b5-aaac-ea5825b5287f',
  '91a1ab39-7e4d-41f7-961f-7a8f65b07d31',
  '1bf682da-2e86-4177-ba09-75b8274f620f',
  '8876a6a8-288f-4b71-8d1e-6d07da7411d0',
  '9c41e858-17d8-4555-a8fd-1de104282e42',
  'f042556b-fc88-480c-9337-22bc6adddd30',
  '631ccdbe-64c3-40ad-ac21-eb7e2d6b0fcd',
  '3396445f-bb6a-48f4-b3ff-4774ecefa243',
  '860a6705-4be0-4402-8576-34d9fc15be29',
  'b6d3ec1a-b7bc-43e6-a5f2-f4c0633d859d',
  'd865054e-ba2c-4ece-b540-cb29cb2b28d6',
  '8776c56a-001c-4be6-9e52-a92b7f7f08b5',
  'b8be1be2-9d57-41ee-9710-d0f8b470ffdd',
  'e17c8cd1-6ad3-4d87-acf3-c35717528592',
  '5627b7c5-ca7b-4c99-bf24-905858609273',
  '70ecf645-eceb-4847-9a40-98aeebafd582',
  'abfc65a8-1bb1-4db9-ac91-e0fea90455b5',
  'e8662ce8-8da3-44d4-9c4e-73e6db71a5ff',
  'prod-1781975241266-3t0yumy1h',
  '52069df5-c194-4c33-a084-3e52f21fb659',
  '34672605-2bd8-4bce-a4cd-d4e86a4f043b',
  '85900769-09d7-4393-941a-54d338e44c60',
  'b9e50db1-c9c6-4101-8834-2da4ccc89f16',
  '8237f963-5550-42a4-928d-c1012160a7f2',
  '6ab48ec5-5b4d-464b-9a5d-f61f0e68c35c',
  '8fe56445-88a2-4c75-804c-dfc914be035c',
  '7e9d4980-eb56-4b41-a0bb-2efb37755f5f',
  'd729d0ea-25d7-4db4-84f1-4cf37906bbd4',
  '96a5765f-781d-4f94-a87b-b349f5424c2d',
  '213c4a08-f1b8-4071-8a13-34cd619373f3',
  'ac7d40f9-a9aa-42c2-a079-662d481d2ff4',
  '3496cbbc-f6e7-4757-9319-531d29aca812',
  'acd84d34-be14-43b6-85aa-a22574d2f115',
  '090824ac-c1aa-490b-ad26-eae2900f59c3',
  '15b62cbe-8e2b-447c-a4f6-269dfb9f4225',
  '2ee8c83e-e7ee-48b3-88fa-384e6d7dc0b9',
  '74149fd0-c947-4d41-a492-5fc55d4224d8',
  '1035f7b0-b3c3-4b9a-8efc-3b5eafb34991',
  '745999de-44c1-4098-b01a-d29e14fa66b2',
  '9f4bda90-f7cb-47f4-9234-904bd0842528',
  '7368fd2b-f084-4e30-b780-4451dfff6e53',
  '8cb87d45-e3e0-46e4-930a-5df3772c23cd',
  '5e6a2707-e98b-4e1d-88a3-c04f36a50998',
  'bf1deb19-55fe-4302-8119-fa3e4d48ee9a',
  '6347a427-e7ae-4455-b2b1-9bbbdcc37ee6',
  '1fa2a7f3-1cc2-4e0f-acb8-158e9ffd9eaf',
  'c71c4e6b-2eba-46ea-b8cb-7f327c9d870a',
  '0bc28827-9d4e-4551-bf68-33cba9dd10fb',
  'f03bf9cc-b351-425d-896c-87f837f9327e',
  '7184d41d-4c3b-473b-a01d-52a28f5dcf79',
  '2d7cbe6f-c8f5-4dca-8218-22b0418bf532',
  '14c0935f-2981-4258-8b9c-34c511216eeb',
  '1db2614e-a209-490a-9cd7-94a7e5bff164',
  'd3a15e34-bc8a-42f7-8606-09b7d15f5467',
  'b8aef98b-bf49-47b6-8682-879257dd74f0',
  '57ad3495-3f23-4829-9f67-347af801e867',
  '1a747115-4a6e-490f-8a05-97cd72f591b0',
  'prod-1782399449911-r8n1pvsk2',
  '675d87b2-11ec-482e-9da1-91242547375f',
  'f8a8acc5-91ee-42f1-ba88-e88b87efb7cf',
  '6d9241e4-d5ee-4448-85bb-4569e74deb7b',
  '48e280a0-ca74-4ae6-af1a-8a54e48a2916',
  '5b0a0900-a464-4f36-b6e9-26dc797d5885',
  '5f58cd5a-1d6d-44d4-9dfd-ece2cc4fa7a4',
  'a6d3f164-9d4b-4ec2-8394-b17b1014c59c',
  'e9c24468-2f16-4ef0-bf1a-a03876475a17',
  '4322f860-0468-4244-b402-a221b50560e0',
  '86f207d9-7405-4bb1-a534-ff6f7f0cea82',
  '2af160d5-4d4e-421a-806d-e9b7134292f7',
  'de404b5f-fc60-4cb7-b451-8b54a0d7fa38',
  '5e13ed57-ceb6-4537-82fc-b43af6617887',
  '9125d1df-218b-4866-b81e-078bbb7b14e7',
  '3487cde2-7ae5-4d05-9835-4b61dc5988e3',
  '7f9e08ee-8654-4706-b9ad-792bcb6fab5e',
  'a1579202-45ac-42b7-a91c-49a77f452dc3',
  '4998d7f1-4adb-4c39-9b0c-87d48da053ae',
  'bd502327-5254-4026-b7d5-9a97fee0fe50',
  'e136d0b0-0635-4243-883a-da4ed3f3b123',
  '9a6480aa-97f7-4009-8eaf-601ec0db4acd',
  'ef046ba9-0ef4-4c2f-902d-f6a26028cf41',
  '0b2d12b6-2567-4bbd-ae61-f29f8efa0ef0',
  '780d61e1-f336-4cb6-9042-2ee01fb08f24',
  'ca807a06-bcb3-40b3-8720-48ab88d877d5',
  '7c4a922b-5e34-4bc3-8727-40c01222ecbc',
  '8be40e1c-a119-4f23-968e-eb2e5f2491d3',
  '7e7fa16c-1a5e-4da7-99b3-40abfbc1c2a7',
  'a3b7d45a-42a3-4cd2-b8cf-df285def4a15',
  '907b7077-0bd0-427f-8d35-eea2e51ec7b3',
  'aedda85f-918d-46de-b42d-3266a130e4a4',
  '91b90c02-28f2-4fdc-bce2-f5dec87bb971',
  '821a7ac2-374e-4fc2-90c1-098380f2b5b4',
  '0b6fe664-c668-4a66-a024-4cfdb0774389',
  '8cc190d2-5642-4984-b648-9a8409ab65d2',
  'c70361ef-8d6f-46eb-aa4b-8df8d514ecdc',
  'f68bbdf7-a9d7-4193-883b-d8bf9d927215',
  'df9ee0b3-98d4-48dd-898b-efffce723b49',
  'd70e20c3-e03d-4c4b-96c2-e5ddad6bb1b4',
  '0b443f21-8561-4559-8450-433b03213e91',
  '8fb648a2-4779-4855-b206-4fcf9a3ac90f',
  '345fbdd8-369c-452f-ae61-b8d9624e0ab9',
  'cdc7550e-07af-49a0-b1dd-460318e774fc',
  '39ac2b15-8b1f-489f-84ad-4cd525abba5a',
  '66f8b584-989c-497a-b6ca-e2c205255ea5',
  '267b144c-0cbb-41e4-8764-fdaf1053ba92',
  '15446bfb-2ad5-4a52-9133-336c714c7925',
  '43d81574-6d08-479e-9164-256456526b06',
  'd0131f09-fe24-4261-9efc-7771ca7d66ca',
  '33883093-2860-468d-9300-a24396a18968',
  'e2507651-3ec1-444d-9edd-48719bf8431c',
  '7de330c5-e669-491c-ac31-9dd311c6dbac',
  '26e1628b-1491-436c-baec-bdb330db71b4',
  'c682d35a-5915-49ac-9d5f-69a3f820d882',
  '8beeecfe-601e-4e76-be77-aa57a8234411',
  'eefa4da4-fc4d-47a7-b2a6-2385a5ca0d4b',
  '35dd002a-5123-4ddd-8ccf-1d8f7fe318a9',
  'f3b082da-92df-4214-bd38-4dc3ea1207ef',
  'ce78e085-6048-46bd-9b3f-5325a196388b',
  '3acaf2ff-e16a-4a01-aee7-d76396d8315d',
  '576d7ab2-6468-47b3-a7e2-3e3ec8fc1eb1',
  '2795e559-b3e9-412d-bad1-d804f5f4f3dd',
  '6ac362bb-ddb9-44db-b4e2-f57316fdfcec',
  '31051836-7379-4f80-b0da-295ed4f424ab',
  '451a51ca-7da1-42d6-9f33-5f3bf0bef35a',
  'd0382aa5-668c-4ff8-85bf-10c59a03fd89',
  '7c3546d9-8f17-49c3-9681-60001e013225',
  'abd9eb41-e00c-4ca2-abc1-bf100126d306',
  '46557614-6433-4ae6-9428-8f455a4879ea',
  'cfaf9858-eca4-43cc-8239-3e8a87c0e46d',
  'a9fa0aee-529a-4694-ad36-52a1e641f732',
  'f36c23c0-84d9-4966-8353-80a65e6ac681',
  'ac63751d-d8f0-4b85-a9e2-0c5799de16b3',
  '98f8109c-45ed-49e6-bec9-5590366f5cb4',
  '1b493f27-0163-44f7-88df-13e372efea9b',
  'a2a81d0b-4995-4a38-a749-fc93ceb96160',
  'caec8c17-9054-4294-86fd-5ba1f87513b5',
  '97e39b99-0741-4510-a0f2-7185c957693a',
  'e3d85de8-7b31-4d26-b226-4dfeab4ecbd3',
  '1267a566-bff7-4b66-9d33-9dc72d213ce3',
  'c3d6aa2f-6ca6-47cf-859f-488d3a41bc95',
  'f748b156-1729-49bb-a4a4-7529b6084c98',
  '491a735a-d67e-40cf-8089-fa91a82e3eed',
  'fbf9781e-b478-4fb1-a066-6f5780cdc1f5',
  '60cc1af6-e2a5-4b29-8997-3b404678269f',
  '0ffc5d6e-d26a-4e58-992a-3e633a434453',
  '9a139eca-293b-41b0-b354-e59f09b6e2ac',
  '93dbc534-6575-4f8f-9068-d596447312b6',
  '72a65972-b84a-40e9-a331-20639b5c04fb',
  '3d833986-3151-42a3-90f7-4e1f8f5d2355',
  '92d94849-6311-49b0-81db-1679a7d309cf',
  '535d3aa5-2f48-447f-8269-ac8229b26db7',
  'cc7d83fd-99e4-446e-8d5b-d839143bfd3d',
  '4dac96bf-bdc5-44d9-8845-0970da15c488',
  'b767d561-52bb-4016-9fcc-ad209417711f',
  '5c310985-500a-463f-aab1-5b277e7c231e',
  '58f8fabe-c2d1-4ff3-b84a-76d5aa2942c3',
  'c18df2dd-e94d-4d1e-891b-27e043cecf62',
  '4d293407-baeb-43e8-9296-0b287d71a7b0',
  'ddebf778-964c-4d93-b8c9-0cb02c20aae7',
  'a9e6630a-7ced-450c-84ae-49e27d7cd858',
  '7c9e33eb-d574-4e67-9b3a-0519f4b95342',
  'bf58ae0c-ebda-42ca-9f78-a124d34eaff9',
  'cc3bf509-7eb6-4ab2-b3f9-d420e829dac4',
  '5dcae6f5-f297-43a9-afbf-de144041d901',
  '9d5b7613-fe70-4110-ac61-6f99812c452d',
  'f4ee716f-7f15-4020-a1d1-f21f16facd9d',
  'd69c15c5-12c3-490b-abd2-9d9b9fd4c728',
  '1567ac99-83fa-4f52-a66d-4228244c03d2',
  '5848d363-2276-4005-9f66-74f91873a12e',
  'dfd36393-865f-49e4-a4cc-6ab4f492c2eb',
  'f8adcaae-af0a-4435-9ddc-f1110d056a49',
  '7e9e1424-8869-4c0f-ad5b-87763832fd8f',
  '20bdf76f-c590-497f-b2e6-deb6e2db46fd',
  '8d80c2e0-6c08-4e37-8e12-44e8bb29785d',
  '081279dc-99d0-4847-afb1-015af2713aac',
  'c4664765-dc35-4593-920f-9cb052338e8e',
  'eef1c95e-d350-4d53-ad85-feac23ac6e15',
  '141c5e8b-c480-40f8-9be5-588b4fad23b3',
  '3fb1fb16-cf35-453c-9014-032c1fdae4e7',
  'f5526738-ece5-41ed-836c-2fe5da22f8c5',
  '9698e5e1-0235-46b6-b8fd-4f91ef9fa1f3',
  'd88dc447-6bcf-4dd0-af09-dda6b41a2331',
  '09b3421e-4ba8-4fe4-9229-252b967d4dda',
  'c15a2bfc-2268-4ec1-af8a-07233b9f8fbf',
  '9154f929-ec13-4d00-80f7-2feda4aef447',
  '25e4aac8-0226-44c3-9376-e7e2b4c08da9',
  '47988345-3be2-4969-8e76-7db51f7a5c0d',
  '2bcf75a1-ba86-4e70-a715-737c94cb5153',
  'dfc2b0a1-d86f-4ce3-b5d5-16ae6de44b59',
  'acfabebc-16c7-44bc-b826-f1aaecc44cf5',
  'c662d12c-033e-415d-be24-03dd619d57c4',
  '1aac3c11-4fb0-4fc9-98c0-f043d9a33a15',
  '8f78abbb-9521-4c6e-85fb-307102ffe37a',
  'da72f36e-1c13-42de-b4bd-6040637619c8',
  'f4cb522c-9611-4751-b4cc-4a931fe01791',
  '4c869a6f-cd52-4e0f-9be3-933c08476027',
  '18b7ce04-705a-4b3b-9cd0-f75ddddbd4b3',
  '727c21b2-684b-40a3-ad5a-d97191d287c2',
  '283041c3-c711-4e8a-a153-cba97a32c4f0',
  '196fa7e5-2947-429b-9816-d1f5e82221d1',
  '771bf716-46ff-4bd6-9910-cb4bbc19ef2c',
  'f5bad22b-fd62-4385-a934-133d42812a6d',
  '336240ce-04af-41dc-9b2b-b40746448e91',
  '28e951f9-17c2-40ab-a2f2-38a17ea7a057',
  'b5409147-41f5-4377-a0e5-e23da682038a',
  'd7fcf8fe-6ae7-4a4e-88c5-a29c264be33d',
  '6a8ff853-0d17-4af8-900c-5c0c2a21c897',
  '509ac69c-a2ba-4b6b-a39c-3c93d796eee2',
  '685eb8b2-5fa8-49d9-aa05-529dec4e1085',
  '9bf01b17-6a54-415d-8728-3f602c2f9883',
  '9b6b67b3-002d-4645-98aa-9e177d012733',
  '98718a37-6efd-4bc6-9dec-b75356571c35',
  'fdcb6d30-fd64-4f91-88b6-af86892de55c',
  '29454bd2-3b3a-4bab-9422-cd555c576188',
  'd6bb69b3-189f-4d77-aa4a-eef8c112b4d2',
  '891c52e4-3351-4a30-9450-bd7b129a52a9',
  'ce4a3856-1975-4a19-8e39-f66d1a8bac50',
  '9c8de13d-245a-4cc5-9b43-6d7b94ea1b8d',
  'prod-1779282830032-yel8e4te9',
  'prod-1779893915114-z42ej50w4',
  'prod-1779893913452-37xafykb5',
  'prod-1779893977234-a5rpht4q9',
  '8da5abbb-8d87-4d15-8e5f-0b81a77c649a',
  'fd5525bd-401c-485a-961c-7d7400a76d7d'
);
```

**Productos (250):**

| ID | Nombre actual | SKU | Stock | Sugerencia |
|---|---|---|---|---|
| `18ec4c03-d174-4238-8ba7-f399e5c9cbc8` | Bajo Chasis Led Rgb Con Control St-lgh60car | `6703` | ? | |
| `bfcf3f45-c5af-4b1e-bb6e-046c49575695` | Cree Led 4 Colores S4 H11 Lampara | `S4 H11` | ? | |
| `6019ac60-511a-4f1e-9288-0919f35d9bc8` | Cree Led 9006 Mini 2 Led 30000 Lumenes Juego | `9F130021766` | ? | |
| `ad8b0239-edb5-4863-985b-7f6cfd949905` | Cree Led C6 / Z1 H15 (1 Juego) | `5264` | ? | |
| `ad09a401-1fb6-4250-befb-a5391d829a00` | Cree Led C6 Iael 5202 H16 (1 Lampara) | `C6 5202` | ? | |
| `f43ea568-ac85-4769-bd61-0c193cf3be74` | Cree Led C6 Iael 9005 6000k (1 Lampara) | `C6 9005` | ? | |
| `82477d4c-2092-4343-8fa4-0e64f80a5215` | Cree Led C6 Iael 9007 6000k (1 Lampara) | `CREE 9007` | ? | |
| `912de260-fdeb-4e68-83d6-6340178c6918` | Cree Led C6 Iael H3 (1 Lampara) | `C6 H3` | ? | |
| `cfdd3978-29b0-4189-9490-9ccb9719fba5` | Cree Led C6 Iael H7 (1 Lampara) | `C6 H7` | ? | |
| `06b312b4-6c21-436c-820e-b598c8744b56` | Cree Led C6 Iael Hb4 9006 (1 Lampara) | `C6 HB4 9006` | ? | |
| `10a493c5-fc34-431e-a634-49235e459b56` | Cree Led C6 Mini 9004 (1 Lampara) | `C6MINI9004` | ? | |
| `0e6badff-17e9-41dd-bd4e-5455a4173033` | Cree Led C6 Mini 9007 (1 Lampara) | `C6MINI9007` | ? | |
| `2a8a24dc-8ddf-4aec-9a74-6979eb1f56b3` | Cree Led C6 Mini H16 5202 (1 Lampara) | `C6MINI-H16` | ? | |
| `d9c6d98f-5a42-4bb2-88c9-c3ed55a81ae2` | Cree Led C6 Mini H4 (1 Lampara) | `C6 MINI H4` | ? | |
| `51b2e0da-4891-4d27-a031-e9ef5cd67adf` | Cree Led C6 Mini Hb4 9006 (1 Lampara) 6 Generacion Sin Cooler | `C6MINI9006` | ? | |
| `783aad47-9f5b-4043-8a4a-eefa6a55f2af` | Cree Led H15 Cambus (Juego) | `H15CAMBUS` | ? | |
| `a1c2416e-cd88-4b89-a0d6-37927ff02835` | Cree Led H3 Mini 2 Led 30000 Lumenes Juego | `9F130019142` | ? | |
| `prod-1782142384070-fgvjbf7my` | Cree led H4 4 colores S4 (unidad) | `PRD-1782142384070-9YFFX` | ? | |
| `af212d80-ae72-401a-ab63-bb68d201dca0` | Cree Led H4 Lupa Y10(juego) | `7377` | ? | |
| `31b81c42-f864-4c79-b398-14226b9d926f` | Cree Led Ir100 Super Canbus Chip Csp 9005 Hb3 Juego | `IR100-9005` | ? | |
| `f2aff8fb-06d3-4ab4-b93e-eec89c3c3113` | Cree Led Ir100 Super Canbus Chip Csp 9005 Juego Black Sapphire 75 Watts | `BS-IR100-9005` | ? | |
| `prod-1779394822684-c8s21ncx9` | CREE LED IR100 SUPER CANBUS CHIP CSP H11 JUEGO | `H11-IR100` | ? | ⚠️ → "Cree LED Ir100 Super Canbus Chip CSP H11 Juego" *(ALL CAPS name)* |
| `00f4a2c7-cab9-4ea1-b2dd-10a8c94218f2` | Cree Led Ir100 Super Canbus Chip Csp H11 Juego Black Sapphire 75 Watts | `BS-IR100-H11` | ? | |
| `51a7ccf8-85d7-48af-9583-2e2b3180e515` | Cree Led Ir100 Super Canbus Chip Csp H27 880 Juego | `IR100-880` | ? | |
| `d4dee4ae-e33c-462e-bb67-7db7cf807548` | Cree Led Ir100 Super Canbus Chip Csp H3 Juego | `IR100-H3` | ? | |
| `4c2ecb8d-6dda-4b4b-a79b-99cc3a2ac0d6` | Cree Led Ir100 Super Canbus Chip Csp H4 Juego | `IR100-H4` | ? | |
| `f7cc2d6f-500f-46dd-b58d-95890bfc10ae` | Cree Led Ir100 Super Canbus Chip Csp H4 Juego 55 Watts Dakar | `NEWIRX100-H4` | ? | |
| `24c7049c-c685-45b5-aaac-ea5825b5287f` | Cree Led Ir100 Super Canbus Chip Csp H4 Juego Black Sapphire 75 Watts | `BS-IR100-H4` | ? | |
| `91a1ab39-7e4d-41f7-961f-7a8f65b07d31` | Cree Led Ir100 Super Canbus Chip Csp H7 Juego | `IR100-H7` | ? | |
| `1bf682da-2e86-4177-ba09-75b8274f620f` | Cree Led Ir100 Super Canbus Chip Csp H7 Juego 55 Watts Dakar | `NEWIR100H7` | ? | |
| `8876a6a8-288f-4b71-8d1e-6d07da7411d0` | Cree Led Ir100 Super Canbus Chip Csp H7 Juego Black Sapphire 75 Watts | `BS-IR100-H7` | ? | |
| `9c41e858-17d8-4555-a8fd-1de104282e42` | Cree Led J10 5202 H16 (1 Lampara) | `CREE 5202` | ? | |
| `f042556b-fc88-480c-9337-22bc6adddd30` | Cree Led J10 9006 6000k (1 Lampara) | `CREE 9006` | ? | |
| `631ccdbe-64c3-40ad-ac21-eb7e2d6b0fcd` | Cree Led J10 H3 6000k (1 Lampara) | `CREE H3` | ? | |
| `3396445f-bb6a-48f4-b3ff-4774ecefa243` | Cree Led J10 H7 6000k (1 Lampara) | `CREE H7` | ? | |
| `860a6705-4be0-4402-8576-34d9fc15be29` | Cree Led Kb2 H4 30000 Lm 42w 24v Y 12v Juego | `KB2-H4` | ? | |
| `b6d3ec1a-b7bc-43e6-a5f2-f4c0633d859d` | Cree Led Kb3 Lupa H4 Proyector Super Canbus 40000 Lumenes Juego | `KB3-H4` | ? | |
| `d865054e-ba2c-4ece-b540-cb29cb2b28d6` | Cree Led Kb3 Lupa Mini H7 Super Canbus 40000 Lumenes (Juego) | `KB3-H7` | ? | |
| `8776c56a-001c-4be6-9e52-a92b7f7f08b5` | Cree Led Kb4 H1 8000k Juego | `KB4-H1` | ? | |
| `b8be1be2-9d57-41ee-9710-d0f8b470ffdd` | Cree Led Kb4 H11 8000k Juego | `KB4-H11` | ? | |
| `e17c8cd1-6ad3-4d87-acf3-c35717528592` | Cree Led Kb4 H4 8000k Juego | `KB4-H4` | ? | |
| `5627b7c5-ca7b-4c99-bf24-905858609273` | Cree Led Kb4 Hb3 9005 8000k Juego | `KB4-9005` | ? | |
| `70ecf645-eceb-4847-9a40-98aeebafd582` | Cree Led Kb4 Hb4 9006 8000k Juego | `KB4-9006` | ? | |
| `abfc65a8-1bb1-4db9-ac91-e0fea90455b5` | Cree Led Laser H7 (Juego) | `8741` | ? | |
| `e8662ce8-8da3-44d4-9c4e-73e6db71a5ff` | Cree Led Mi2 H7 Juego | `MI2 H11` | ? | |
| `prod-1781975241266-3t0yumy1h` | CREE LED R8 CHIP 5202 CSP PSX24W H16 JUEGO | `5202-R8` | ? | ⚠️ → "Cree LED R8 Chip 5202 CSP Psx24w H16 Juego" *(ALL CAPS name)* |
| `52069df5-c194-4c33-a084-3e52f21fb659` | Cree Led R8 Chip Csp 9005 Juego | `R89005` | ? | |
| `34672605-2bd8-4bce-a4cd-d4e86a4f043b` | Cree Led R8 Chip Csp 9006 Juego | `R8-9006` | ? | |
| `85900769-09d7-4393-941a-54d338e44c60` | Cree Led R8 Chip Csp H1 Juego | `R8-H1` | ? | |
| `b9e50db1-c9c6-4101-8834-2da4ccc89f16` | Cree Led R8 Chip Csp H11 Juego | `R8-H11` | ? | |
| `8237f963-5550-42a4-928d-c1012160a7f2` | Cree Led R8 Chip Csp H27 Juego | `R8H27` | ? | |
| `6ab48ec5-5b4d-464b-9a5d-f61f0e68c35c` | Cree Led R8 Chip Csp H3 Juego | `R8-H3` | ? | |
| `8fe56445-88a2-4c75-804c-dfc914be035c` | Cree Led R8 Chip Csp H4 Juego | `R8-H4` | ? | |
| `7e9d4980-eb56-4b41-a0bb-2efb37755f5f` | Cree Led R8 Chip Csp H7 Juego | `R8-H7` | ? | |
| `d729d0ea-25d7-4db4-84f1-4cf37906bbd4` | Cree Led S6 High Definition P13w (Juego) | `S6 P13W` | ? | |
| `96a5765f-781d-4f94-a87b-b349f5424c2d` | Cree Led Y3 H27 880 Slim Sin Cooler (1 Lampara) | `Y3H27` | ? | |
| `213c4a08-f1b8-4071-8a13-34cd619373f3` | Cree Led Y3 Slim Sin Cooler 9005 (1 Lampara) | `Y3-9005` | ? | |
| `ac7d40f9-a9aa-42c2-a079-662d481d2ff4` | Cree Led Y3 Slim Sin Cooler 9006 (1 Lampara) | `Y3-9006` | ? | |
| `3496cbbc-f6e7-4757-9319-531d29aca812` | Cree Led Y3 Slim Sin Cooler 9012 (1 Lampara) | `Y3-9012` | ? | |
| `acd84d34-be14-43b6-85aa-a22574d2f115` | Cree Led Y3 Slim Sin Cooler H1 (1 Lampara) | `Y3-H1` | ? | |
| `090824ac-c1aa-490b-ad26-eae2900f59c3` | Cree Led Y3 Slim Sin Cooler H11 (1 Lampara) | `Y3-H11` | ? | |
| `15b62cbe-8e2b-447c-a4f6-269dfb9f4225` | Cree Led Y3 Slim Sin Cooler H16 5202 (1 Lampara) | `Y3-PSX24` | ? | |
| `2ee8c83e-e7ee-48b3-88fa-384e6d7dc0b9` | Cree Led Y3 Slim Sin Cooler H3 (1 Lampara) | `Y3-H3` | ? | |
| `74149fd0-c947-4d41-a492-5fc55d4224d8` | Cree Led Y3 Slim Sin Cooler H4 (1 Lampara) | `Y3-H4` | ? | |
| `1035f7b0-b3c3-4b9a-8efc-3b5eafb34991` | Cree Led Y3 Slim Sin Cooler H7 (1 Lampara) | `Y3-H7` | ? | |
| `745999de-44c1-4098-b01a-d29e14fa66b2` | Cree Led Y3 Slim Sin Cooler P13 (1 Lampara) | `Y3-P13` | ? | |
| `9f4bda90-f7cb-47f4-9234-904bd0842528` | Drl Alas De Angel | `5745` | ? | |
| `7368fd2b-f084-4e30-b780-4451dfff6e53` | Faro Auxiliar Led 3" Ir100 20w 2400lm Unidad | `DJ5900MINI` | ? | |
| `8cb87d45-e3e0-46e4-930a-5df3772c23cd` | Faro Auxiliar Led 3" Ir100 Para Embutir 20w 2400lm Unidad | `DJ5900JEEP` | ? | |
| `5e6a2707-e98b-4e1d-88a3-c04f36a50998` | Faro Auxiliar Led 4" Ir100 60w 7200lm Unidad | `DJ5900CROSS` | ? | |
| `bf1deb19-55fe-4302-8119-fa3e4d48ee9a` | Faro Cuadrado 16 Led 10x10 Cm 48w | `963` | ? | |
| `6347a427-e7ae-4455-b2b1-9bbbdcc37ee6` | Faro De Led Rectangular 18w 6 Led 16 X 4,5 Cm | `DJ1112SPEP` | ? | |
| `1fa2a7f3-1cc2-4e0f-acb8-158e9ffd9eaf` | Faro De Led Redndo 17,5 Cm 17 Led 51w | `IAL-51RR` | ? | |
| `c71c4e6b-2eba-46ea-b8cb-7f327c9d870a` | Faro Led Redondo 152.4mm 11 Leds, Carcaza Cromada | `IAL-201` | ? | |
| `0bc28827-9d4e-4551-bf68-33cba9dd10fb` | Faro Led Redondo 27w 9 Leds 11 Cm Cada Uno | `DJ912SPEPI` | ? | |
| `f03bf9cc-b351-425d-896c-87f837f9327e` | Faro Led Redondo 36w 8 Leds 11 Cm Ojo De Angel Cada Uno | `DJ912MAX` | ? | |
| `7184d41d-4c3b-473b-a01d-52a28f5dcf79` | Faro Led Redondo 42 W 14 Leds 11 Cm Cada Uno | `DJ3914SPEP` | ? | |
| `2d7cbe6f-c8f5-4dca-8218-22b0418bf532` | Faro Led Redondo 90w 30 Leds 11 Cm Cada Uno | `DJ912MULTI` | ? | |
| `14c0935f-2981-4258-8b9c-34c511216eeb` | Faro Led Redondo 9v A 36v Giro Posicion + Luz | `DJ912JEEP` | ? | |
| `1db2614e-a209-490a-9cd7-94a7e5bff164` | Faro Strobo Chato 12 Led Azul | `9630` | ? | |
| `d3a15e34-bc8a-42f7-8606-09b7d15f5467` | Faro Strobo Chato 12 Led Azul / Rojo | `9634` | ? | |
| `b8aef98b-bf49-47b6-8682-879257dd74f0` | Faro Strobo Chato 12 Led Rojo | `9632` | ? | |
| `57ad3495-3f23-4829-9f67-347af801e867` | Ficha 2v Faro Para Lampara H11 | `1567` | ? | |
| `1a747115-4a6e-490f-8a05-97cd72f591b0` | Ficha 2v Faro Para Lampara Psx24w 5202 H16 | `1789` | ? | |
| `prod-1782399449911-r8n1pvsk2` | FICHA FOCO PT43 12342 H4 | `PRD-1782399449911-2SDQX` | ? | ⚠️ → "Ficha Foco Pt43 12342 H4" *(ALL CAPS name)* |
| `675d87b2-11ec-482e-9da1-91242547375f` | Foco 1 Polo Naranja Patas Desfazadas 21w 12v Kobo | `12496CH` | ? | |
| `f8a8acc5-91ee-42f1-ba88-e88b87efb7cf` | Foco 1 Polo Naranja Patas Desfazadas 21w 12v Osram Philips | `12496NA` | ? | |
| `6d9241e4-d5ee-4448-85bb-4569e74deb7b` | Foco 1 Polo Naranja Patas Iguales 21w 12v Kobo China | `12498CHNA` | ? | |
| `48e280a0-ca74-4ae6-af1a-8a54e48a2916` | Foco 1 Polo Naranja T20 21w 12v Magnetti Marelli | `12065NACH` | ? | |
| `5b0a0900-a464-4f36-b6e9-26dc797d5885` | Foco 1 Polo Naranja T20 21w 12v Osram | `12065NA` | ? | |
| `5f58cd5a-1d6d-44d4-9dfd-ece2cc4fa7a4` | Foco 1 Polo Patas Iguales 10w 12v Osram | `5008` | ? | |
| `a6d3f164-9d4b-4ec2-8394-b17b1014c59c` | Foco 1 Polo Patas Iguales 15w 12v China | `4542CH` | ? | |
| `e9c24468-2f16-4ef0-bf1a-a03876475a17` | Foco 1 Polo Patas Iguales 21w 12v Kobo | `12498CH` | ? | |
| `4322f860-0468-4244-b402-a221b50560e0` | Foco 1 Polo Patas Iguales 21w 12v Philips | `12498` | ? | |
| `86f207d9-7405-4bb1-a534-ff6f7f0cea82` | Foco 1 Polo Patas Iguales 5w 12v China | `12821CH` | ? | |
| `2af160d5-4d4e-421a-806d-e9b7134292f7` | Foco 1 Polo Patas Iguales 5w 12v Philips | `12821` | ? | |
| `de404b5f-fc60-4cb7-b451-8b54a0d7fa38` | Foco 1 Polo Rojo Patas Iguales 21w 12v China | `12498CHRO` | ? | |
| `5e13ed57-ceb6-4537-82fc-b43af6617887` | Foco 1 Polo Rojo Tipo T20 Plastico 21w 12v China | `3156CHRO` | ? | |
| `9125d1df-218b-4866-b81e-078bbb7b14e7` | Foco 1 Polo T20 21w 12v Kobo | `12065CH` | ? | |
| `3487cde2-7ae5-4d05-9835-4b61dc5988e3` | Foco 1 Polo T20 21w 12v Osram | `12065` | ? | |
| `7f9e08ee-8654-4706-b9ad-792bcb6fab5e` | Foco 1 Polo Tablero 6v Miniatura | `BA7S` | ? | |
| `a1579202-45ac-42b7-a91c-49a77f452dc3` | Foco 1 Polo Tipo T20 Plastico 21w 12v China | `3156CH` | ? | |
| `4998d7f1-4adb-4c39-9b0c-87d48da053ae` | Foco 2 Polo T20 | `12066KO` | ? | |
| `bd502327-5254-4026-b7d5-9a97fee0fe50` | Foco 2 Polos Patas Desiguales 21/5w 12v Neolux Kobo Magneti Marelli Narva | `12499CH` | ? | |
| `e136d0b0-0635-4243-883a-da4ed3f3b123` | Foco 2 Polos Patas Desiguales 21/5w 12v Philips / Osram | `12499` | ? | |
| `9a6480aa-97f7-4009-8eaf-601ec0db4acd` | Foco 2 Polos Patas Desiguales Ambar 21/5w 12v Kobo Magneti Marelli Narva | `12499CHNA` | ? | |
| `ef046ba9-0ef4-4c2f-902d-f6a26028cf41` | Foco 2 Polos Patas Desplazadas Desfazadas China 21/5w 12v | `12491CH` | ? | |
| `0b2d12b6-2567-4bbd-ae61-f29f8efa0ef0` | Foco 2 Polos Patas Iguales Kobo 21/5w 12v | `12502CH` | ? | |
| `780d61e1-f336-4cb6-9042-2ee01fb08f24` | Foco 2 Polos Patas Iguales Philips 21/5w 12v | `12502` | ? | |
| `ca807a06-bcb3-40b3-8720-48ab88d877d5` | Foco 2 Polos Rojo Tipo T20 Plastico 21/5w 12v China | `3157CHNA` | ? | |
| `7c4a922b-5e34-4bc3-8727-40c01222ecbc` | Foco 2 Polos Tipo T20 Plastico 21/5w 12v China | `3157CH` | ? | |
| `8be40e1c-a119-4f23-968e-eb2e5f2491d3` | Foco 2 Polos Valeo Patas Desfazadas 21/5w 12v 32205 | `12594` | ? | |
| `7e7fa16c-1a5e-4da7-99b3-40abfbc1c2a7` | Foco 9004 Economico | `9004` | ? | |
| `a3b7d45a-42a3-4cd2-b8cf-df285def4a15` | Foco 9006 Hb4 Economico Neolux / Kobo12v51w | `4529` | ? | |
| `907b7077-0bd0-427f-8d35-eea2e51ec7b3` | Foco 9012 Hir2 Kobo | `9012` | ? | |
| `aedda85f-918d-46de-b42d-3266a130e4a4` | Foco H1 Economico | `12258CH` | ? | |
| `91b90c02-28f2-4fdc-bce2-f5dec87bb971` | Foco H1 Philips / Osram | `12258` | ? | |
| `821a7ac2-374e-4fc2-90c1-098380f2b5b4` | Foco H1 Prolight Blue (Par) | `64150` | ? | |
| `0b6fe664-c668-4a66-a024-4cfdb0774389` | Foco H10 Economica | `4010` | ? | |
| `8cc190d2-5642-4984-b648-9a8409ab65d2` | Foco H10 Prolight Blue ( Par ) | `64143` | ? | |
| `c70361ef-8d6f-46eb-aa4b-8df8d514ecdc` | Foco H11 Kobo Economica Motolite | `4011` | ? | |
| `f68bbdf7-a9d7-4193-883b-d8bf9d927215` | Foco H11 Osram | `64211` | ? | |
| `df9ee0b3-98d4-48dd-898b-efffce723b49` | Foco H13 Prolight Blue ( Par ) | `4013` | ? | |
| `d70e20c3-e03d-4c4b-96c2-e5ddad6bb1b4` | Foco H16 Kobo Halogena | `KOPSX24WGL` | ? | |
| `0b443f21-8561-4559-8450-433b03213e91` | Foco H16 Osram | `64219L` | ? | |
| `8fb648a2-4779-4855-b206-4fcf9a3ac90f` | Foco H21 China Desfasada 12056 | `12056` | ? | |
| `345fbdd8-369c-452f-ae61-b8d9624e0ab9` | Foco H21 Osram Desfasada | `64136` | ? | |
| `cdc7550e-07af-49a0-b1dd-460318e774fc` | Foco H27 880 Economico | `5269` | ? | |
| `39ac2b15-8b1f-489f-84ad-4cd525abba5a` | Foco H27 881 Blue ( Par ) | `5270` | ? | |
| `66f8b584-989c-497a-b6ca-e2c205255ea5` | Foco H27 881 Osram / Philips | `PGJ13` | ? | |
| `267b144c-0cbb-41e4-8764-fdaf1053ba92` | Foco H3 Economicas | `2505` | ? | |
| `15446bfb-2ad5-4a52-9133-336c714c7925` | Foco H3 Osram 12336 | `12336` | ? | |
| `43d81574-6d08-479e-9164-256456526b06` | Foco H3 Osram Cool Blue Intense | `64151CBI` | ? | |
| `d0131f09-fe24-4261-9efc-7771ca7d66ca` | Foco H3 Prolight Blue ( Par ) | `64149` | ? | |
| `33883093-2860-468d-9300-a24396a18968` | Foco H4 Kobo Economica | `KO12342` | ? | |
| `e2507651-3ec1-444d-9edd-48719bf8431c` | Foco H4 Philips / Osram | `12342C1` | ? | |
| `7de330c5-e669-491c-ac31-9dd311c6dbac` | Foco H4 Prolight Blue ( Par ) | `64148` | ? | |
| `26e1628b-1491-436c-baec-bdb330db71b4` | Foco H5 Pt45 Wega Blue Intense ( Par ) | `2517XNBI` | ? | |
| `c682d35a-5915-49ac-9d5f-69a3f820d882` | Foco H7 Kobo China | `12972CH` | ? | |
| `8beeecfe-601e-4e76-be77-aa57a8234411` | Foco H7 Philips / Osram | `12972C1` | ? | |
| `eefa4da4-fc4d-47a7-b2a6-2385a5ca0d4b` | Foco H9 Economica | `4019` | ? | |
| `35dd002a-5123-4ddd-8ccf-1d8f7fe318a9` | Foco H9 Prolight Blue ( Par ) | `64145` | ? | |
| `f3b082da-92df-4214-bd38-4dc3ea1207ef` | Foco Kobo 12v 19w Ambar Ps19w | `PSY19W` | ? | |
| `ce78e085-6048-46bd-9b3f-5325a196388b` | Foco P13 Kobo Chino | `P13CH` | ? | |
| `3acaf2ff-e16a-4a01-aee7-d76396d8315d` | Foco Psx24w 12v Pg20 5202 | `KOPSX24GL` | ? | |
| `576d7ab2-6468-47b3-a7e2-3e3ec8fc1eb1` | Foco T10 12v 5w Posicion Azul Kobo Blue | `12961BLUE` | ? | |
| `2795e559-b3e9-412d-bad1-d804f5f4f3dd` | Foco T10 12v 5w Posicion Kobo | `12961CH` | ? | |
| `6ac362bb-ddb9-44db-b4e2-f57316fdfcec` | Foco T10 12v 5w Posicion Naranja | `12961NA` | ? | |
| `31051836-7379-4f80-b0da-295ed4f424ab` | Foco T10 12v 5w Posicion Philips /Osram | `12961` | ? | |
| `451a51ca-7da1-42d6-9f33-5f3bf0bef35a` | Foco Tablero Con Portalampara Gris Philips | `12602` | ? | |
| `d0382aa5-668c-4ff8-85bf-10c59a03fd89` | Foco Tablero Con Portalampara Kobo | `12598CH` | ? | |
| `7c3546d9-8f17-49c3-9681-60001e013225` | Foco Tablero Con Portalampara Negro Philips | `12597` | ? | |
| `abd9eb41-e00c-4ca2-abc1-bf100126d306` | Foco Tablero Con Portalampara Philips | `12603` | ? | |
| `46557614-6433-4ae6-9428-8f455a4879ea` | Foco Tablero Con Portalampara Philips | `12625` | ? | |
| `cfaf9858-eca4-43cc-8239-3e8a87c0e46d` | Foco Tablero Con Portalampara Philips | `12598` | ? | |
| `a9fa0aee-529a-4694-ad36-52a1e641f732` | Foco Tubular 28mm 5w Osram | `6410` | ? | |
| `f36c23c0-84d9-4966-8353-80a65e6ac681` | Foco Tubular 32mm 3w Osram | `6428` | ? | |
| `ac63751d-d8f0-4b85-a9e2-0c5799de16b3` | Foco Tubular 38mm 5w Osram | `6418` | ? | |
| `98f8109c-45ed-49e6-bec9-5590366f5cb4` | Foco Tubular 39mm 10w Osram | `12866` | ? | |
| `1b493f27-0163-44f7-88df-13e372efea9b` | Foco Tubular 41mm 10w Osram | `6411` | ? | |
| `a2a81d0b-4995-4a38-a749-fc93ceb96160` | Hilo De Led 1m Blanco Toma 12v | `5687` | ? | |
| `caec8c17-9054-4294-86fd-5ba1f87513b5` | Hilo De Led 1m Rojo Toma 12v | `5690` | ? | |
| `97e39b99-0741-4510-a0f2-7185c957693a` | Hilo De Led 1m Violeta Toma 12v | `5693` | ? | |
| `e3d85de8-7b31-4d26-b226-4dfeab4ecbd3` | Hilo De Led 3m Azul Toma 12v | `5701` | ? | |
| `1267a566-bff7-4b66-9d33-9dc72d213ce3` | Hilo De Led 3m Rojo Toma 12v | `5700` | ? | |
| `c3d6aa2f-6ca6-47cf-859f-488d3a41bc95` | Hilo De Led 5m Violeta Toma 12v | `7577` | ? | |
| `f748b156-1729-49bb-a4a4-7529b6084c98` | Jgo Apoya Vaso Chevrolet Led Rgb | `5764` | ? | |
| `491a735a-d67e-40cf-8089-fa91a82e3eed` | Jgo Apoya Vaso Citroen Led Rgb | `5765` | ? | |
| `fbf9781e-b478-4fb1-a066-6f5780cdc1f5` | Jgo Apoya Vaso Fiat Led Rgb | `5766` | ? | |
| `60cc1af6-e2a5-4b29-8997-3b404678269f` | Jgo Apoya Vaso Ford Led Rgb | `6827` | ? | |
| `0ffc5d6e-d26a-4e58-992a-3e633a434453` | Jgo Apoya Vaso Honda Led Rgb | `5767` | ? | |
| `9a139eca-293b-41b0-b354-e59f09b6e2ac` | Jgo Apoya Vaso Jeep Led Rgb | `5768` | ? | |
| `93dbc534-6575-4f8f-9068-d596447312b6` | Jgo Apoya Vaso Renault Led Rgb | `5771` | ? | |
| `72a65972-b84a-40e9-a331-20639b5c04fb` | Jgo Apoya Vaso Sin Logo Led Rgb | `5769` | ? | |
| `3d833986-3151-42a3-90f7-4e1f8f5d2355` | Jgo Apoya Vaso Vw Led Rgb | `5772` | ? | |
| `92d94849-6311-49b0-81db-1679a7d309cf` | Juego Drl Exterior 30cm Con Giro Secuencial | `5477` | ? | |
| `535d3aa5-2f48-447f-8269-ac8229b26db7` | Juego Drl Interior 60 Cm Con Giro Intermitente | `5470` | ? | |
| `cc7d83fd-99e4-446e-8d5b-d839143bfd3d` | Juego Drl Interior 60 Cm Giro Secuencial | `5472` | ? | |
| `4dac96bf-bdc5-44d9-8845-0970da15c488` | Juego Drl Rgb Exterior Con Giro Secuencial C/ Control | `5466` | ? | |
| `b767d561-52bb-4016-9fcc-ad209417711f` | Juego Giro Moto Flecha Ambar | `5739` | ? | |
| `5c310985-500a-463f-aab1-5b277e7c231e` | Juego Giro Moto Secuencial 12 Led | `5661` | ? | |
| `58f8fabe-c2d1-4ff3-b84a-76d5aa2942c3` | Lampara D1r Xenon Unidad 6000k | `6029` | ? | |
| `c18df2dd-e94d-4d1e-891b-27e043cecf62` | Lampara D1s Xenon Unidad 6000k | `6032` | ? | |
| `4d293407-baeb-43e8-9296-0b287d71a7b0` | Lampara D2s Xenon Unidad 4300k | `D2S` | ? | |
| `ddebf778-964c-4d93-b8c9-0cb02c20aae7` | Lampara D2s Xenon Unidad 6000k | `4593` | ? | |
| `a9e6630a-7ced-450c-84ae-49e27d7cd858` | Lampara D3s Xenon Unidad 4300k | `6049` | ? | |
| `7c9e33eb-d574-4e67-9b3a-0519f4b95342` | Lampara D3s Xenon Unidad 8000k | `D3S` | ? | |
| `bf58ae0c-ebda-42ca-9f78-a124d34eaff9` | Lampara Led Tipo Bosch 2 Polo Moto | `6843` | ? | |
| `cc3bf509-7eb6-4ab2-b3f9-d420e829dac4` | Led 1 Polo Luna Cambus Naranja | `6083` | ? | |
| `5dcae6f5-f297-43a9-afbf-de144041d901` | Led 1 Polo T20 Ambar | `LED3156ULTAMBAR` | ? | |
| `9d5b7613-fe70-4110-ac61-6f99812c452d` | Led 1 Polo T20 Blanco | `LED7440ULTBL` | ? | |
| `f4ee716f-7f15-4020-a1d1-f21f16facd9d` | Led 1 Polo T20 Blanco | `LED3156ULTBLANCO` | ? | |
| `d69c15c5-12c3-490b-abd2-9d9b9fd4c728` | Led 1 Polos 13 Smd Naranja | `1540` | ? | |
| `1567ac99-83fa-4f52-a66d-4228244c03d2` | Led 2 Polo Ambar 180° 36 Smd Naranja | `45790` | ? | |
| `5848d363-2276-4005-9f66-74f91873a12e` | Led 2 Polo Cob Blanco | `6095` | ? | |
| `dfd36393-865f-49e4-a4cc-6ab4f492c2eb` | Led 2 Polo Flash Blanco | `98632` | ? | |
| `f8adcaae-af0a-4435-9ddc-f1110d056a49` | Led 2 Polo Flash Rojo | `98633` | ? | |
| `7e9e1424-8869-4c0f-ad5b-87763832fd8f` | Led 2 Polo Luna Cambus Naranja | `6096` | ? | |
| `20bdf76f-c590-497f-b2e6-deb6e2db46fd` | Led 2 Polos Rojo Patas Desiguales 21/5w 12v | `LED12499ULROJO` | ? | |
| `8d80c2e0-6c08-4e37-8e12-44e8bb29785d` | Led 2 Polos T20 Plastico Ambar | `LED3157ULTAMBAR` | ? | |
| `081279dc-99d0-4847-afb1-015af2713aac` | Led 2 Polos T20 Plastico Blanco | `LED3157ULTBLANCO` | ? | |
| `c4664765-dc35-4593-920f-9cb052338e8e` | Led 5202 H16 | `5991` | ? | |
| `eef1c95e-d350-4d53-ad85-feac23ac6e15` | Led Bay9s Blanco 19 Led | `9615` | ? | |
| `141c5e8b-c480-40f8-9be5-588b4fad23b3` | Led Blanco 1 Polo Patas Iguales 21w 12v | `LED12498ULTRABL` | ? | |
| `3fb1fb16-cf35-453c-9014-032c1fdae4e7` | Led Drl Cob 17 Cm Blanco (Par) | `4364` | ? | |
| `f5526738-ece5-41ed-836c-2fe5da22f8c5` | Led Rojo 1 Polo Patas Iguales 21w 12v | `LED12498ULROJO` | ? | |
| `9698e5e1-0235-46b6-b8fd-4f91ef9fa1f3` | Led T10 1 Puntas Azul / Rojo | `6382` | ? | |
| `d88dc447-6bcf-4dd0-af09-dda6b41a2331` | Led T10 12 W Blanco 12v | `6122` | ? | |
| `09b3421e-4ba8-4fe4-9229-252b967d4dda` | Led T10 18w Blanco | `6126` | ? | |
| `c15a2bfc-2268-4ec1-af8a-07233b9f8fbf` | Led T10 24 Puntas Blanco 24v | `6818` | ? | |
| `9154f929-ec13-4d00-80f7-2feda4aef447` | Led T10 2w Blanco | `6771` | ? | |
| `25e4aac8-0226-44c3-9376-e7e2b4c08da9` | Led T10 2w Blanco 12v | `3284` | ? | |
| `47988345-3be2-4969-8e76-7db51f7a5c0d` | Led T10 2w Rojo 12v | `3282` | ? | |
| `2bcf75a1-ba86-4e70-a715-737c94cb5153` | Led T10 2w Verde 12v | `3283` | ? | |
| `dfc2b0a1-d86f-4ce3-b5d5-16ae6de44b59` | Led T10 4w Cambus Blanco Siliconado | `6718` | ? | |
| `acfabebc-16c7-44bc-b826-f1aaecc44cf5` | Led T10 5 Puntas Blanco 12v | `6698` | ? | |
| `c662d12c-033e-415d-be24-03dd619d57c4` | Led T10 5 Puntas Blanco 24v | `6819` | ? | |
| `1aac3c11-4fb0-4fc9-98c0-f043d9a33a15` | Led T10 6w Cambus Blanco | `6150` | ? | |
| `8f78abbb-9521-4c6e-85fb-307102ffe37a` | Led T10 Blanco 12v | `6132` | ? | |
| `da72f36e-1c13-42de-b4bd-6040637619c8` | Led T10 Iron100 Canbus Blanco (Par) | `LED12961CREE` | ? | |
| `f4cb522c-9611-4751-b4cc-4a931fe01791` | Led T10 Iron100 Canbus Naranja (Par) | `LED12961CREEAMBAR` | ? | |
| `4c869a6f-cd52-4e0f-9be3-933c08476027` | Led T10 Lupa 27w Blanco | `6135` | ? | |
| `18b7ce04-705a-4b3b-9cd0-f75ddddbd4b3` | Led T20 1 Polo Naranja Cambus | `6171` | ? | |
| `727c21b2-684b-40a3-ad5a-d97191d287c2` | Led T20 1 Polos Blanco Cambus | `6172` | ? | |
| `283041c3-c711-4e8a-a153-cba97a32c4f0` | Led T20 1 Polos Blanco Economico | `6173` | ? | |
| `196fa7e5-2947-429b-9816-d1f5e82221d1` | Led T5 Blanco Rojo Azul 3 Led | `T5LED` | ? | |
| `771bf716-46ff-4bd6-9910-cb4bbc19ef2c` | Led Tablero C/soporte Azul Blanco Rojo | `40760` | ? | |
| `f5bad22b-fd62-4385-a934-133d42812a6d` | Led Tubular 32 Mm | `40743` | ? | |
| `336240ce-04af-41dc-9b2b-b40746448e91` | Led Tubular 36 Mm Canbus | `40746` | ? | |
| `28e951f9-17c2-40ab-a2f2-38a17ea7a057` | Led Tubular 39 Mm Canbus | `40739` | ? | |
| `b5409147-41f5-4377-a0e5-e23da682038a` | Led Tubular 41 Mm Canbus | `40740` | ? | |
| `d7fcf8fe-6ae7-4a4e-88c5-a29c264be33d` | Led Tubular 42 Mm | `40745` | ? | |
| `6a8ff853-0d17-4af8-900c-5c0c2a21c897` | Led Tubular 42 Mm Canbus | `40744` | ? | |
| `509ac69c-a2ba-4b6b-a39c-3c93d796eee2` | Logo De Cortesia Con Luz Chevrolet (Instalados $ 31000) | `5748` | ? | |
| `685eb8b2-5fa8-49d9-aa05-529dec4e1085` | Logo De Cortesia Con Luz Citroen (Instalados $ 31000) | `5750` | ? | |
| `9bf01b17-6a54-415d-8728-3f602c2f9883` | Logo De Cortesia Con Luz Fiat (Instalados $ 31000) | `5751` | ? | |
| `9b6b67b3-002d-4645-98aa-9e177d012733` | Logo De Cortesia Con Luz Peugeot (Instalados $ 31000) | `5756` | ? | |
| `98718a37-6efd-4bc6-9dec-b75356571c35` | Luz Usb Interior Disco | `7561` | ? | |
| `fdcb6d30-fd64-4f91-88b6-af86892de55c` | Ojo De Aguila Juego X 2 | `7476` | ? | |
| `29454bd2-3b3a-4bab-9422-cd555c576188` | Ojo De Angel Rg Con App Aro De Aluminio 360 | `6355` | ? | |
| `d6bb69b3-189f-4d77-aa4a-eef8c112b4d2` | Ojo De Angel Rgb 60 Mm | `6354` | ? | |
| `891c52e4-3351-4a30-9450-bd7b129a52a9` | Plafon Cob 24.5 X 6 Cm Con Tecla | `7351` | ? | |
| `ce4a3856-1975-4a19-8e39-f66d1a8bac50` | Plaqueta De 12 Led Alta Luminosidad | `7389` | ? | |
| `9c8de13d-245a-4cc5-9b43-6d7b94ea1b8d` | Regla De Led Ajk Para Controlador Mini Vu Blanco | `RL-AJK` | ? | |
| `prod-1779282830032-yel8e4te9` | TERCERA LUZ DE STOP C/32 LED | `FS-004` | ? | ⚠️ → "Tercera LUZ DE Stop C/32 LED" *(ALL CAPS name)* |
| `prod-1779893915114-z42ej50w4` | TIRA DE LED FLEXIBLE ROJO | `PRD-1779893915114-MJUUW` | ? | ⚠️ → "Tira DE LED Flexible Rojo" *(ALL CAPS name)* |
| `prod-1779893913452-37xafykb5` | TIRA DE LED FLEXIBLE ROJO | `PRD-1779893913451-HSLZH` | ? | ⚠️ → "Tira DE LED Flexible Rojo" *(ALL CAPS name)* |
| `prod-1779893977234-a5rpht4q9` | TIRA LED FLEXIBLE BLANCO | `PRD-1779893977234-87W0F` | ? | ⚠️ → "Tira LED Flexible Blanco" *(ALL CAPS name)* |
| `8da5abbb-8d87-4d15-8e5f-0b81a77c649a` | Tira Led Flexible Rgb Para Optica Drl 60 Cm | `6901` | ? | |
| `fd5525bd-401c-485a-961c-7d7400a76d7d` | Tira Led Premium Flexible Para Optica Intermitente 60 Cm X 2 Drl Con Luz De Giro | `5473` | ? | |

| **SQL — Renombrar productos** |
|---|---|
```sql
UPDATE product SET name = 'Cree LED Ir100 Super Canbus Chip CSP H11 Juego' WHERE id = 'prod-1779394822684-c8s21ncx9';
UPDATE product SET name = 'Cree LED R8 Chip 5202 CSP Psx24w H16 Juego' WHERE id = 'prod-1781975241266-3t0yumy1h';
UPDATE product SET name = 'Ficha Foco Pt43 12342 H4' WHERE id = 'prod-1782399449911-r8n1pvsk2';
UPDATE product SET name = 'Tercera LUZ DE Stop C/32 LED' WHERE id = 'prod-1779282830032-yel8e4te9';
UPDATE product SET name = 'Tira DE LED Flexible Rojo' WHERE id = 'prod-1779893915114-z42ej50w4';
UPDATE product SET name = 'Tira DE LED Flexible Rojo' WHERE id = 'prod-1779893913452-37xafykb5';
UPDATE product SET name = 'Tira LED Flexible Blanco' WHERE id = 'prod-1779893977234-a5rpht4q9';
```

---

### 3. Audio y Multimedia

**SQL — Crear categoría:**
```sql
INSERT INTO category (id, name, description, color, "sortOrder", "isActive")
VALUES ('cat-audio', 'Audio y Multimedia', 'Estéreos, parlantes, subwoofers, tweeters, drivers, amplificadores, frentes adaptadores, cables y accesorios de audio', '#8B5CF6', 3, true);
```

**SQL — Asignar productos a esta categoría:**
```sql
UPDATE product SET "categoryId" = 'cat-audio' WHERE id IN (
  '16b2bacf-d5c9-4493-a42a-13e8ba2415ab',
  '6a30ece9-bd0b-49ed-bc66-4476864ec9a4',
  '2b8772fc-ead8-4d41-9e8f-0eae4587dabb',
  '76aeb32b-9a45-4d12-8515-c4ce14e11b08',
  '643b4573-269b-4e80-9359-103579127aa7',
  '4890f3fd-9e68-48f5-aa5c-ba01aabefe1a',
  '4d282895-305d-4962-af6e-58ad502ded6c',
  'b15fdf74-7c35-49bd-9a93-df08219e458b',
  '70b97f98-47fe-4904-8146-55227e9e8a4d',
  '5c04ffa2-a432-490f-a5a0-c571f4b19abb',
  '4ca64557-4825-4fbd-8573-86c51f540608',
  'e123d6a4-babb-4c16-8c74-577179decb87',
  'c90af6f6-f371-4149-8c66-ff9e34a8f6a5',
  '9f39d74d-6dbe-439e-990b-7e8e7c2f17c2',
  'e9e625d5-51a0-457b-81fd-217b70483dd7',
  '34f7570b-1296-485c-8ffe-8e02cf74f323',
  '918ba93e-aaed-49c2-baba-0d7cb4d1d55f',
  '221d71a3-63ae-4bae-9295-e01f9798b10e',
  '81a5f2b8-1a38-4e24-8d6b-2ce76d5ce35e',
  'c12acf4f-d83d-4488-9d7d-88c276a1836e',
  '3380b3ec-4774-4b66-adb6-71c20892b85e',
  '3223849b-77bf-41b5-8c26-f95854d2231a',
  'c8962ce0-cfcc-41d9-bb5b-f3c0980c4b5b',
  '193659db-c144-4448-ab05-2113cd1c4efb',
  '0f4c8214-53a9-4fc0-a721-9784e3697637',
  '30a8f26f-e27f-4638-bb41-709bb7f989b4',
  '254d943c-cbb0-4ebb-ba63-01f7973d8978',
  '74db4bb7-29cd-4600-812a-3afd9f6e8af9',
  'c7fb2d34-502f-44b4-8155-bf8f8a815ee0',
  'c2912a22-0d03-4517-aee5-ae97c73e2fe4',
  'aa09ba22-be5d-4eeb-a414-199d1fe948b5',
  '72b6a895-529c-4a81-ab48-b270b33fd46b',
  '2717076b-e8e5-4b79-9f6c-91d359fbea70',
  'fe7e575d-af58-40b6-a611-6101802336e1',
  '70e4180b-b36e-4a28-89cf-f8c0378bbc84',
  '936b46fd-2586-411d-ab35-bd9cf7dfd6b9',
  '4dc40c80-2ae7-4ecf-ba5c-9b826e59624f',
  '8279e237-b94a-4012-ba44-890b79c7731e',
  '36dbe1c5-5435-41c1-9f8c-f62077754dbf',
  'bceee652-e431-483a-9bcb-a73d5c7297b7',
  'd87b7c87-cd79-46d7-87c9-672b0bf82eed',
  '89ed5c64-3f78-4786-ba04-c1cbf48e5ba5',
  'e4c8150e-16b6-4cda-b532-a4f9d59b576c',
  '1bcc7d89-fe69-4e37-ba02-5718f644b350',
  '97007027-0f63-4589-8ce1-8dfc15d806d3',
  '88ecf422-34c1-4b11-a3b2-048d846f7661',
  '9febd648-c4af-437a-8a64-4c4f460d3dac',
  'a4b75efc-8dba-49e4-91cf-e09b9742f26d',
  '20e48d13-3624-4be2-aaa2-1c097a71ac91',
  '4d56f0da-1fa2-437d-ad4f-6f14514a9a67',
  'ec84d3ae-fe94-41b6-9a56-093b2809bfa6',
  'e1e87229-5e32-4dc3-9266-8b23ad55d620',
  'e7ed88db-3ce4-4433-afa1-9a79ff4c30c2',
  '045e615a-f2bc-4454-8dab-e8fe7c488630',
  '36d19b83-a4eb-4c70-b439-eb78d759c33f',
  'daea275c-7783-4247-b23b-dc681a8e2a65',
  '2ad67beb-6020-41bf-bcbe-fa03e6437350',
  '4f3f9684-3bc4-429b-af2a-2abea9af9ef0',
  '1a2d2217-725b-4373-96bf-440ae274b218',
  '8a480d19-9f0e-42d8-9478-e2321a0b4306',
  'e2b08178-a467-41d4-9611-47f13cc1ad84',
  '0aebf6a4-9c72-404b-a386-b6799255ab2d',
  'a9dd2d09-4a52-4f28-9f4f-463574c910ee',
  '7020814a-8671-4e0a-9936-09f5dd262b6f',
  'cd3322ac-094d-494d-a631-51b323aed553',
  'd2273ba1-2570-449b-9ac6-587f910c5b7d',
  '7c8a1da1-05cf-43a4-96b0-9beeb100c835',
  '8f049a28-d144-48f3-bf9e-9407118cbb73',
  'bb001ec3-0095-4376-a485-28c2d1dee7f7',
  '6ee7cb66-13e8-40b0-8362-72280123587d',
  'e84c65be-24a0-4948-9e13-e7b8a6c8c1e4',
  'e906d629-6056-43ae-aef5-4411a8d69ca7',
  '095dae3b-bfaf-4b56-be57-acab062b1fdd',
  'fe1b973b-274d-4354-a14d-2712a6e60f8d',
  'cafb0e4c-574f-46c8-b3d6-e4670a96f73a',
  '137f0f89-5cb3-4f0d-a6eb-77759d668b82',
  'f7aef208-1664-4b53-8cef-0c4535e0ba9c',
  '5d09b72f-6d34-4869-8e4a-ed2b8af2fc26',
  '60ebd80e-7eec-4167-bfb4-776ccd1b3eb1',
  '369a2158-f543-42a7-9c09-88ecfa41a71e',
  '96d21e26-1929-49fd-9607-0098ac78a9e7',
  'b6c04220-b8cb-4ec2-acb0-07691c0ad9da',
  'c322916d-3c33-4b59-ab9e-ac01f26a45a8',
  'a20dd658-fd6d-4a98-8172-f24c2265ee10',
  'f26ffa0c-1804-4bc4-b197-a2566ee291c2',
  '6e2da058-0143-493a-b76e-fabf23e8f610',
  '9fa34f7c-9a6a-43a7-a4bb-b3d126d3daa3',
  'ca2ce1c1-1dc1-429c-83a9-fc16f18160b1',
  '198f8377-39c8-48b4-aa77-cf4bcad19333',
  '326a83b6-e325-445a-9c06-9af8f8d13f2c',
  '8de2012b-901f-4bd7-8db6-dc37928f659f',
  'd9422765-4893-4e71-9b2e-cd7ac23e6f9f',
  '761f3828-eca2-41cb-8ba7-c0e02d503ce4',
  'e26d5091-270b-42c8-ab91-b95403779eab',
  'b289f2e1-ad74-4af5-ba57-681bc1a2e309',
  '03d14872-a0f1-4f09-9df4-78d1526f4ee5',
  '7cad97f3-c325-49c6-9c76-06abe6e98591',
  '296389ab-db95-4b72-97c4-658410da77ab',
  '7ecc3dbe-059e-4849-a22d-4209306a39d9',
  'd97f47ee-4206-432f-81d5-1be8dd9dcd91',
  'b2d0470b-e5f5-40e6-9e6b-f11de7ad12f6',
  'ed51dc71-f845-43dd-9fd5-4a724b9439ff',
  '5194a810-3898-4429-bd65-7f6c96059947',
  '62f83a8f-e88c-4616-bba4-348b4461b9dc',
  '2a33dfac-5a87-4405-b2a1-e160a1704fea',
  '05f5ecdf-3e18-4b37-be11-f3f4ec47788d',
  'dccdc472-8c30-455c-8fad-e3af8244e546',
  '83e0a98a-24bf-47fb-b042-8237b2589c28',
  '44de0a5f-461c-43c7-b652-a3e8b7318250',
  'bc7fc0c8-4265-4989-8242-283230e203a3',
  '3f03b988-1e13-4ff5-896f-0d6c3b45db1d',
  'ce7ef6f7-4da0-42ea-a9d5-0f5dad3af4e2',
  'f81d39b4-48b1-4fec-aff4-15329c5c66df',
  '854df17f-123f-4d1c-b34b-29162c09b315',
  '7229532d-4cf0-49cc-9e1b-598cf6477f46',
  '3df1911f-b193-4217-adc6-d1c5421240f0',
  'f6a32be1-a728-41fa-9822-bd80905ba6bf',
  '229c20eb-55da-455a-bcdc-254d04bbfe18',
  '82bddced-2f2e-4dcb-aa45-b8ed058d6409',
  'a82b360e-0a76-4cfa-964b-7c5f6a67920c',
  'cb5d5a0a-1d32-4194-96da-42e8d174607c',
  'b4ff8b7e-19f4-45e8-bf2e-b36b5354f37b',
  '21666fa4-f417-49b0-93a4-9a44c6dddc85',
  '9320c1d5-d502-41ee-a92d-4b679ba061ab',
  '2f77913f-5d97-4e0f-a18d-349def457b55',
  '3c57f64f-24ae-4a25-bbe9-e037ce69c633',
  '27e60a01-66b1-4591-8098-d843a7d17698',
  'dbd868ec-c42a-44f1-9ee7-263b1770b7bd',
  '775b0f60-dac5-4df3-9db4-1aff23b9a136',
  'e3511394-1606-4605-957b-3d21a97f7d17',
  'a946bee4-74dc-47a5-bef0-030f54d53578',
  '49b0b285-2f82-406e-b7f7-b23e9f90f3ed',
  'bbbea626-42bd-4840-ba08-0a51098c2b82',
  '92629b71-3ca4-4e2a-92cb-e9e6c10b0c09',
  'c1fc028a-b7a9-481e-8a56-6c08744214f8',
  '848e4002-39ee-458e-8030-56fc4929ff46',
  'e761910d-9ff1-434c-ac65-39e2d7850470',
  'd376cd78-2121-45ac-ada4-23551610917a',
  '4fadac6c-2d5b-48b9-a700-02f3f3f51779',
  '75a7cd0f-794f-4c26-9be9-75965bf2c2d3',
  'baf673a9-2340-4f44-83b5-f88bd1a21d65',
  '09acd910-7540-4cbd-8956-dfeb7d69950e',
  '3fc19945-3be9-4439-9d06-323d8f4ae0b2',
  'a7ccca24-ad45-4934-a992-04d04f5f41ad',
  '7e8fd0b5-eeac-47cb-af1e-19b5859c8979',
  'ece99d6f-42fc-47bb-9b94-ce9adeb68a4f',
  '0eaf9ed2-9fa8-46c2-9ba5-0cffb4518821',
  '6b90e09e-4fdd-4c33-80b1-bc157041dd06',
  'fa157173-f6b8-4365-a470-2346e6cd833d',
  '363b498c-8f17-4cf1-99ee-4043c3f64f0b',
  '9ffad661-14bd-442c-b987-873a723d749b',
  '04aecbb7-ad9c-4ef1-9506-c25f6c561792',
  '40b770cf-ac69-40b8-afd6-75eb07d6373b',
  '4835dfe7-001c-4b40-b753-3b15529933ac',
  'd19c7bbc-e103-4321-bf26-2318bc7286c5',
  '6a2815d2-30f7-47d7-a65b-265634603b1d',
  'd2f16613-3932-4a8f-8406-e4a60b48bc92',
  '028a4b47-516d-4df7-a091-7c53b9114237',
  'be6bb4b4-1ede-4ce3-82ff-44559cb24941',
  '510db539-cb89-4393-9b1c-a10be8828eba',
  '8a4e4a39-cd42-424c-a950-48d938496348',
  'f4114866-939f-4779-bf43-3cc890674dd4',
  '66087940-2f6b-4715-9fef-f56010f6dbec',
  'e3a4be46-7ee0-42a9-b25d-72d6f22a36f5',
  '3d847f40-43ee-40db-a676-892dead6dd3d',
  '3e722ba8-e28d-45c1-8bf0-d4d8624ab018',
  '4b3c826f-9a59-44bb-ba03-e54280580609',
  '9a4dfeb4-6188-4dc8-8251-6fab52daa538',
  '0874e4a1-bf41-4334-860e-50b18b2565f3',
  '8be598a0-5222-49ab-81e7-3070394a2589',
  'c6d4205d-78ff-4b6b-a15e-c9065703f8ce',
  '70738744-f1cf-49b8-9f6b-fbc695edff67',
  '36e30ba4-8807-4334-9ca3-3975b5499a92',
  '69c658b4-0ef0-449e-b181-80eb35ec576d',
  '9c3ecb7d-6b7a-4dab-9cc0-55fd3652355a',
  'ab837ade-a5f2-4573-97b6-7feeceac97c5',
  '09ed3ad8-f4d4-457c-a502-fe8bd894ef98',
  'f140557e-4fc2-496f-ae78-99937790e9ed',
  'e8a72755-db6b-48a0-a9aa-e2b6c4175fd3',
  '170f80c0-cbd1-44ee-a81d-bef5112eb71a',
  'a018234c-6e5d-4d22-9cd3-b7b95e576f68',
  '691d788e-3626-45b9-b3dc-d75bcf49b654',
  '9641d289-31f8-4b17-9118-e0baae40a1d2',
  'e1ab89ee-9bd4-4c0e-85da-428326bcd0ff',
  'a75b6da1-d1d9-40f0-b8a3-22553e1a7b69',
  'b80c4b45-5f3c-466b-953e-5286a490e1e3',
  '74fc4b71-ad1a-4a4a-a3ee-c5c7a66e2e8a',
  '2e15fd99-86ec-44d2-8649-92ca5b110fd2',
  'e025dfbc-626d-451c-bba0-5233d9169301',
  'cbea960c-5da3-4a7d-9e62-c5351b2e469f',
  'fd23bc39-dabf-4215-8c2d-71dd1cc50f77',
  '01325b03-19e6-4881-aebb-c6ce9958b22d',
  '7217762b-0586-47e9-a95d-1280f0534627',
  'f4ff9272-3da4-43a6-9794-94dd3aba7bba',
  'bd47678d-aa89-40c4-b2e6-388efdb78cc2',
  '90a0a89a-163d-4f05-80d7-fde21ebccb18',
  '91b20881-73e3-4dee-a8ad-803920accba8',
  '8ded465d-1b6b-4e55-9b46-7089f58f8498',
  '57d95a6c-ee95-479d-98de-891e6aaed03d',
  '9e6b2f2d-8b5d-42f2-82fc-bc81075991e1',
  '42cba379-7f5f-4901-b47f-f6185407ea67',
  'd6dc3d1f-2835-49da-9972-0c891c9d1f15',
  '6cff8897-c71c-456f-9d39-f902b94cee53',
  '215957c8-d8a0-49bf-aace-d0cc8df7af6a',
  'eb0a940b-33cb-4a46-9254-fd8ba5dad9f6',
  'd5f58287-c5b6-429c-a5a0-912d9bf2c6d6',
  '80f7a4f5-e8cb-4483-b87d-5c0063387bed',
  '63fe047e-0fc3-4e84-921d-068184e34c1b',
  'd17cbcb0-5102-4092-81c9-15567c1d1e01',
  'f7d3cfbe-b0c8-447f-adbe-b7af50a24640',
  '7be01ef9-c4c7-44d1-96af-98dc8fa563fa',
  'f63a39c7-32da-4e6e-a152-f3bc80c9b9df',
  '46d4c540-8bac-4394-b3ea-f7fc85bdcc6b',
  '7cce939b-4a76-4c69-8be1-bfbfb3279a0b',
  'beb3f51b-daf2-4ccb-9849-85f78342fcf0',
  '6c812a2a-c365-4597-a444-18ca8582ee7d',
  '7f7e3e5e-f592-479a-aa46-925e74ff54e5',
  '73c1d57d-90ee-42a0-adec-916b7476ec88',
  'ecde6c9a-8f74-4ef7-adf8-27f2afd4b64a',
  '56c0b8d8-1b30-4464-b988-70e9f2899dc5',
  'd9a1bc3d-d78b-4733-a983-decaec0bbde9',
  '94d1a4da-0bb2-482f-a315-bdcf61b259ea',
  'b21f2c8b-a522-4791-8bd7-c20334b7e9ae',
  '1d540df4-c13f-4bd4-83b7-a2e16d98d71f',
  'c3475bde-771b-48ef-93e0-fb690fadebe8',
  '5d72dafd-69bb-4420-9f11-d15d8b331b4c',
  '652d930a-f8bd-46c5-bf0e-861284871efe',
  'cb227a90-ab1b-49c1-8bff-3605136dc419',
  'd552052c-4d5d-4cbd-9155-d9953a66ff4d',
  'd98aa18d-7511-45c7-befd-7bec32187f95',
  'a9c52cb6-3720-46c6-ac96-62ee474a2390',
  '37f0409a-fe94-484d-b339-fb88c7325c65',
  '82b13027-5f9a-4bf1-9780-84227e1b1c6d',
  '91e52542-6151-40cd-8d40-623cfab046fa'
);
```

**Productos (234):**

| ID | Nombre | SKU | Stock |
|---|---|---|---|
| `16b2bacf-d5c9-4493-a42a-13e8ba2415ab` | Adaptador De Impedancia Blauline Ba-60 | `8153` | ? |
| `6a30ece9-bd0b-49ed-bc66-4476864ec9a4` | Adaptador De Impedancia Strong | `NS-60` | ? |
| `2b8772fc-ead8-4d41-9e8f-0eae4587dabb` | Adaptador Macho 3.5 St/2hembra Rca | `AU7` | ? |
| `76aeb32b-9a45-4d12-8515-c4ce14e11b08` | Aro Adaptador De 5x7" A 5 | `7781` | ? |
| `643b4573-269b-4e80-9359-103579127aa7` | Aro Adaptador Del 5 1/4 Celta Prisma | `8289` | ? |
| `4890f3fd-9e68-48f5-aa5c-ba01aabefe1a` | Aro Adaptador Suplemento (Marco) Para Parlante 6x9 C/u S1 | `7967` | ? |
| `4d282895-305d-4962-af6e-58ad502ded6c` | Aro Adaptador Suplemento (Marco) Para Parlante P/ 6" S2 | `7489` | ? |
| `b15fdf74-7c35-49bd-9a93-df08219e458b` | Audio Control Ecu Soundigital | `AC-5131` | ? |
| `70b97f98-47fe-4904-8146-55227e9e8a4d` | Block Distribuidor 1x0g 3x4g | `V536` | ? |
| `5c04ffa2-a432-490f-a5a0-c571f4b19abb` | Block Distribuidor Blauline1x4g 4x8g | `7423` | ? |
| `4ca64557-4825-4fbd-8573-86c51f540608` | Cable 4 Gauge Strong / Voyz Rojo O Negro (Por Metro) | `ST-RPR4100` | ? |
| `e123d6a4-babb-4c16-8c74-577179decb87` | Cable Mini Plug A Mini Plug De 3.5 1.5 Mts Kta-099 | `7384` | ? |
| `c90af6f6-f371-4149-8c66-ff9e34a8f6a5` | Cable Para Parlante 18 Gauge Negro | `ST-228-BK` | ? |
| `9f39d74d-6dbe-439e-990b-7e8e7c2f17c2` | Cable Para Parlante 18 Gauge Rojo | `ST-228-RD` | ? |
| `e9e625d5-51a0-457b-81fd-217b70483dd7` | Cable Para Parlante 2x0.75mm Por Metro | `ST-16AW-30OFT` | ? |
| `34f7570b-1296-485c-8ffe-8e02cf74f323` | Cable Rca - Rca 1.80 Mts Economico | `AV146` | ? |
| `918ba93e-aaed-49c2-baba-0d7cb4d1d55f` | Cable Rca 5 Metros Blauline ( 9300 ) | `KTA-019.5M` | ? |
| `221d71a3-63ae-4bae-9295-e01f9798b10e` | Cable Rca Mercury 1 Metros Azul | `MK-019` | ? |
| `81a5f2b8-1a38-4e24-8d6b-2ce76d5ce35e` | Cable Rca Strong 5 Mts | `ST-500RCA` | ? |
| `c12acf4f-d83d-4488-9d7d-88c276a1836e` | Cable Rca Strong 5.10 Cm Rojo | `ST-510RCA` | ? |
| `3380b3ec-4774-4b66-adb6-71c20892b85e` | Cable Rca Strong C/remoto 5.10m | `ST-502RCAR` | ? |
| `3223849b-77bf-41b5-8c26-f95854d2231a` | Cable Rca Strong Dual 90 Cm Rojo | `ST-090RCA` | ? |
| `c8962ce0-cfcc-41d9-bb5b-f3c0980c4b5b` | Caja Amplificada Pioneer 20 Cm X 28 Cm X 7 Cm 160w | `TS-WX130EA` | ? |
| `193659db-c144-4448-ab05-2113cd1c4efb` | Caja Blauline Slim 10" Amplificada 180 Rms Bas-10 | `2159` | ? |
| `0f4c8214-53a9-4fc0-a721-9784e3697637` | Caja Magixson Amplificada Parlante 8" 200w | `MG-1081X` | ? |
| `30a8f26f-e27f-4638-bb41-709bb7f989b4` | Camara Strong Hd/dvr Pant 1.5 Sin Instalar | `ST-C18DVR` | ? |
| `254d943c-cbb0-4ebb-ba63-01f7973d8978` | Capacitor Driver O Tweeter 2.2 Uf / 250v | `CAP250/2.2UF` | ? |
| `74db4bb7-29cd-4600-812a-3afd9f6e8af9` | Capacitor Driver O Tweeter 3.3 Uf 250v | `CAP250/3.3UF` | ? |
| `c7fb2d34-502f-44b4-8155-bf8f8a815ee0` | Capacitor Driver O Tweeter 4.7uf X 250v | `CAP250/4.7UF` | ? |
| `c2912a22-0d03-4517-aee5-ae97c73e2fe4` | Corneta Corta Negra Driver 1"permak 7482 | `LC1450` | ? |
| `aa09ba22-be5d-4eeb-a414-199d1fe948b5` | Corneta Guia De Onda Bomber | `1.10.2016` | ? |
| `72b6a895-529c-4a81-ab48-b270b33fd46b` | Corneta Larga Negra Driver 1" 7474 | `LC1425` | ? |
| `2717076b-e8e5-4b79-9f6c-91d359fbea70` | Corneta Larga Trio Aluminio Boca 2" Jbl Selenium | `HL 26-50 TRIO 2` | ? |
| `fe7e575d-af58-40b6-a611-6101802336e1` | Crossover Soundigital 4 Vias | `SDX4.1` | ? |
| `70e4180b-b36e-4a28-89cf-f8c0378bbc84` | Driver Blauline Bd-200 200 W | `BD-200` | ? |
| `936b46fd-2586-411d-ab35-bd9cf7dfd6b9` | Driver Bomber 75 Rms Dbt12-8a | `1.11.2022` | ? |
| `4dc40c80-2ae7-4ecf-ba5c-9b826e59624f` | Driver Bomber Db200x 8 Ohms 75 W | `1.11.1931` | ? |
| `8279e237-b94a-4012-ba44-890b79c7731e` | Driver Selenium Jbl D250-x 8 Ohms | `D250-X` | ? |
| `36dbe1c5-5435-41c1-9f8c-f62077754dbf` | Driver Selenium Jbl D305 150w 8 Ohm | `D305` | ? |
| `bceee652-e431-483a-9bcb-a73d5c7297b7` | Driver Selenium Jbl D405 | `D405` | ? |
| `d87b7c87-cd79-46d7-87c9-672b0bf82eed` | Driver Spyder Drv 400 200w Rms 8 Ohms | `DRV400` | ? |
| `89ed5c64-3f78-4786-ba04-c1cbf48e5ba5` | Driver Strong 60 Watts | `ST-DR005` | ? |
| `e4c8150e-16b6-4cda-b532-a4f9d59b576c` | Estereo 1 Din Economico Con Bt Frente Fijo 1781 1782 | `1781` | ? |
| `1bcc7d89-fe69-4e37-ba02-5718f644b350` | Estereo 1 Din Pioneer Mvh-s235bt Usb/bt/aux | `MVH-S235BT` | ? |
| `97007027-0f63-4589-8ce1-8dfc15d806d3` | Estereo 1 Din Pioneer Usb Aux Bt | `MVH-S145BT` | ? |
| `88ecf422-34c1-4b11-a3b2-048d846f7661` | Estereo 1 Din Strong Dvd Multimedia De 1 Din A 10.1" 2/32gb | `K232ROT10` | ? |
| `9febd648-c4af-437a-8a64-4c4f460d3dac` | Estereo 1 Din Strong Mp3/usb/cargador Usb/sd/aux/bt | `ST-3618J` | ? |
| `a4b75efc-8dba-49e4-91cf-e09b9742f26d` | Estereo Blauline Am/fm Usb/bt Aux Bs - 250bt | `BS-250BT` | ? |
| `20e48d13-3624-4be2-aaa2-1c097a71ac91` | Estereo Doble Din Dvd 7" Usb/bt | `7010B` | ? |
| `4d56f0da-1fa2-437d-ad4f-6f14514a9a67` | Estereo Dvd Doble Din 9" Multimedia 2gb 32gb Rom 9380 | `9380` | ? |
| `ec84d3ae-fe94-41b6-9a56-093b2809bfa6` | Estereo Dvd Doble Din 9" Multimedia 4gb 64gb Rom 2044 | `2044` | ? |
| `e1e87229-5e32-4dc3-9266-8b23ad55d620` | Estereo Dvd Multimedia Doble Din Mercury 7" Usb Sd Bt | `MM-650` | ? |
| `e7ed88db-3ce4-4433-afa1-9a79ff4c30c2` | Estereo Pioneer Dvd Dmh-g225bt Doble Din Usb / Aux/bt | `DMH-G225BT` | ? |
| `045e615a-f2bc-4454-8dab-e8fe7c488630` | Ficha Adaptador De 2 Mini Plug A 1 | `AU12` | ? |
| `36d19b83-a4eb-4c70-b439-eb78d759c33f` | Ficha Adaptador De Mini Plug A Plug Mono | `AU1` | ? |
| `daea275c-7783-4247-b23b-dc681a8e2a65` | Ficha De Estereo Multimarca Generica 14 Pin | `CI-1230` | ? |
| `2ad67beb-6020-41bf-bcbe-fa03e6437350` | Ficha Estereo Pioneer +2010 Nuevo St-273 Carav 15-007 (9665) | `V273` | ? |
| `4f3f9684-3bc4-429b-af2a-2abea9af9ef0` | Ficha Estereo Pioneer Hasta 2010 | `ST-269` | ? |
| `1a2d2217-725b-4373-96bf-440ae274b218` | Ficha Estereo Sony - Aiwa - Jvc | `ST-256` | ? |
| `8a480d19-9f0e-42d8-9478-e2321a0b4306` | Ficha Estereo Tipo Pionner In-dash 16 Vías | `ST-274` | ? |
| `e2b08178-a467-41d4-9611-47f13cc1ad84` | Ficha Ford Parlante | `ST-288` | ? |
| `0aebf6a4-9c72-404b-a386-b6799255ab2d` | Ficha Ford Parlante 1 | `ST-289-1` | ? |
| `a9dd2d09-4a52-4f28-9f4f-463574c910ee` | Ficha Hembra 3.5mm Estereo Prolongacion Plastico | `H3.5ST` | ? |
| `7020814a-8671-4e0a-9936-09f5dd262b6f` | Ficha Tipo Mini Plus 4 Contactos Audio Y Video | `3.5 4P` | ? |
| `cd3322ac-094d-494d-a631-51b323aed553` | Frente Adaptador 1 Din 2007-2008 Toyota Camry | `BKTOYK980` | ? |
| `d2273ba1-2570-449b-9ac6-587f910c5b7d` | Frente Adaptador 1 Din Ford Ka 2009 | `ST-861` | ? |
| `7c8a1da1-05cf-43a4-96b0-9beeb100c835` | Frente Adaptador 1 Din Gaveta Ecosport/bora | `ST-871` | ? |
| `8f049a28-d144-48f3-bf9e-9407118cbb73` | Frente Adaptador 2 Din 7" Vento/amarok /Tiguan/nvo Passat | `ST-807` | ? |
| `bb001ec3-0095-4376-a485-28c2d1dee7f7` | Frente Adaptador 2 Din Bora / Polo / Golf / Passat / Ecosport / 307 St-962 | `8406` | ? |
| `6ee7cb66-13e8-40b0-8362-72280123587d` | Frente Adaptador 2 Din Chevrolet S10 16 / 19 | `8281` | ? |
| `e84c65be-24a0-4948-9e13-e7b8a6c8c1e4` | Frente Adaptador 2 Din Citroen C3 | `7572` | ? |
| `e906d629-6056-43ae-aef5-4411a8d69ca7` | Frente Adaptador 2 Din Corolla 03/06 | `ST-859` | ? |
| `095dae3b-bfaf-4b56-be57-acab062b1fdd` | Frente Adaptador 2 Din Fiesta/transit | `ST-842` | ? |
| `fe1b973b-274d-4354-a14d-2712a6e60f8d` | Frente Adaptador 2 Din Golvi,golg6, Voyage, Saveiro | `7775` | ? |
| `cafb0e4c-574f-46c8-b3d6-e4670a96f73a` | Frente Adaptador 2 Din Ka/focus/escort/ranger/f250 | `7746 7201P` | ? |
| `137f0f89-5cb3-4f0d-a6eb-77759d668b82` | Frente Adaptador 2 Din Palio 2012 / 2013 Negro | `7773` | ? |
| `f7aef208-1664-4b53-8cef-0c4535e0ba9c` | Frente Adaptador 2 Din Peugeot 308 2007/2009 | `ST-955` | ? |
| `5d09b72f-6d34-4869-8e4a-ed2b8af2fc26` | Frente Adaptador 2 Din Toyota Hilux/sw4 (Dos Palitos) | `7667 ST-844` | ? |
| `60ebd80e-7eec-4167-bfb4-776ccd1b3eb1` | Frente Adaptador Audi A2 A3 A6 A8 Tt | `ST-830` | ? |
| `369a2158-f543-42a7-9c09-88ecfa41a71e` | Frente Adaptador Audi A3 03 | `ST-833` | ? |
| `96d21e26-1929-49fd-9607-0098ac78a9e7` | Frente Adaptador Audi A3 03 (Dos Palitos) | `ST-834` | ? |
| `b6c04220-b8cb-4ec2-acb0-07691c0ad9da` | Frente Adaptador Audi A4 | `ST-832` | ? |
| `c322916d-3c33-4b59-ab9e-ac01f26a45a8` | Frente Adaptador Audi A4 94/98 Tt | `ST-831` | ? |
| `a20dd658-fd6d-4a98-8172-f24c2265ee10` | Frente Adaptador Aveo/captiva | `ST-877` | ? |
| `f26ffa0c-1804-4bc4-b197-a2566ee291c2` | Frente Adaptador Bmw Serie 3-e-46 | `ST-836` | ? |
| `6e2da058-0143-493a-b76e-fabf23e8f610` | Frente Adaptador Cherokee / Stratus / Neon / Dakota 00 - 01 | `7063` | ? |
| `9fa34f7c-9a6a-43a7-a4bb-b3d126d3daa3` | Frente Adaptador Chery Tiggo Doble Din | `MRCE001` | ? |
| `ca2ce1c1-1dc1-429c-83a9-fc16f18160b1` | Frente Adaptador Chrysler Neon Bg-84 | `ST-846` | ? |
| `198f8377-39c8-48b4-aa77-cf4bcad19333` | Frente Adaptador Citroen Berlingo | `ST-806` | ? |
| `326a83b6-e325-445a-9c06-9af8f8d13f2c` | Frente Adaptador Crossfox 2013/14 Gris | `7779` | ? |
| `8de2012b-901f-4bd7-8db6-dc37928f659f` | Frente Adaptador Crossfox 2013/14 Negro | `7778` | ? |
| `d9422765-4893-4e71-9b2e-cd7ac23e6f9f` | Frente Adaptador Doble Din 9" Universal | `ST-4116` | ? |
| `761f3828-eca2-41cb-8ba7-c0e02d503ce4` | Frente Adaptador Doble Din De 9" A 7 | `ST-4001` | ? |
| `e26d5091-270b-42c8-ab91-b95403779eab` | Frente Adaptador Fiat Palio- Siena Con Reloj | `7041` | ? |
| `b289f2e1-ad74-4af5-ba57-681bc1a2e309` | Frente Adaptador Fiat Punto 1 Din | `ST-804` | ? |
| `03d14872-a0f1-4f09-9df4-78d1526f4ee5` | Frente Adaptador Fiat Punto 1 Din Linea Marea | `FP-FI009` | ? |
| `7cad97f3-c325-49c6-9c76-06abe6e98591` | Frente Adaptador Focus 2009 - 2014 Negro Doble Din | `7771` | ? |
| `296389ab-db95-4b72-97c4-658410da77ab` | Frente Adaptador Ford Escort 97 | `7483 / 7013` | ? |
| `7ecc3dbe-059e-4849-a22d-4209306a39d9` | Frente Adaptador Ford Focus - Mondeo | `7488` | ? |
| `d97f47ee-4206-432f-81d5-1be8dd9dcd91` | Frente Adaptador Ford Ka 00 | `7045` | ? |
| `b2d0470b-e5f5-40e6-9e6b-f11de7ad12f6` | Frente Adaptador Ford Ka 2000 | `7047` | ? |
| `ed51dc71-f845-43dd-9fd5-4a724b9439ff` | Frente Adaptador Ford Ka 2008 1/2 Din | `1255` | ? |
| `5194a810-3898-4429-bd65-7f6c96059947` | Frente Adaptador Gaveta Toyota Hilux Universal | `ST-829` | ? |
| `62f83a8f-e88c-4616-bba4-348b4461b9dc` | Frente Adaptador Gran Cherokee Dakota Neon 99 | `7038` | ? |
| `2a33dfac-5a87-4405-b2a1-e160a1704fea` | Frente Adaptador Honda City 2 Din | `ST-952` | ? |
| `05f5ecdf-3e18-4b37-be11-f3f4ec47788d` | Frente Adaptador Honda Fit | `7082` | ? |
| `dccdc472-8c30-455c-8fad-e3af8244e546` | Frente Adaptador Jeep Cherokee 99/04 /Dodge Chrysler | `BKCDK636` | ? |
| `83e0a98a-24bf-47fb-b042-8237b2589c28` | Frente Adaptador Mercedes Benz Sprinter | `ST-886` | ? |
| `44de0a5f-461c-43c7-b652-a3e8b7318250` | Frente Adaptador Moldura 2 Din Para Duster Sandero Logan Oroch Negro | `7575` | ? |
| `bc7fc0c8-4265-4989-8242-283230e203a3` | Frente Adaptador Mondeo 2004 | `ST-841` | ? |
| `3f03b988-1e13-4ff5-896f-0d6c3b45db1d` | Frente Adaptador Palio 2 Generacion | `7484 / COD 89/E1` | ? |
| `ce7ef6f7-4da0-42ea-a9d5-0f5dad3af4e2` | Frente Adaptador Palio Ex/ed C/visor 1 Din | `7046` | ? |
| `f81d39b4-48b1-4fec-aff4-15329c5c66df` | Frente Adaptador Palio Gran Siena Doble Din Grafito | `8276` | ? |
| `854df17f-123f-4d1c-b34b-29162c09b315` | Frente Adaptador Peugeot 107 | `ST-848` | ? |
| `7229532d-4cf0-49cc-9e1b-598cf6477f46` | Frente Adaptador Scenic / Megane | `ST-854` | ? |
| `3df1911f-b193-4217-adc6-d1c5421240f0` | Frente Adaptador Scenic / Renault Megane I/fase Ii 1 Din | `7112` | ? |
| `f6a32be1-a728-41fa-9822-bd80905ba6bf` | Frente Adaptador Seat Leon Toledo | `ST-850` | ? |
| `229c20eb-55da-455a-bcdc-254d04bbfe18` | Frente Adaptador Suzuki Grand Vitara | `ST-849` | ? |
| `82bddced-2f2e-4dcb-aa45-b8ed058d6409` | Frente Adaptador Toyota Corolla 2015 | `ST-981` | ? |
| `a82b360e-0a76-4cfa-964b-7c5f6a67920c` | Frente Adaptador Toyota Corolla Hilux Lineas Vieja 1 Din | `7968` | ? |
| `cb5d5a0a-1d32-4194-96da-42e8d174607c` | Frente Adaptador Vw Toureg | `BG-805-ST-805` | ? |
| `b4ff8b7e-19f4-45e8-bf2e-b36b5354f37b` | Fusiblera Anl Audiopipe Premiun | `CQ-2300` | ? |
| `21666fa4-f417-49b0-93a4-9a44c6dddc85` | Hembra Rca Dorada 4 Y 5 Mm | `H/RCA/1/DORADA` | ? |
| `9320c1d5-d502-41ee-a92d-4b679ba061ab` | Kit De Cable 10 Gauge Blauline | `K-100` | ? |
| `2f77913f-5d97-4e0f-a18d-349def457b55` | Kit De Cable 4 Gauge Macars | `ST-KIT04` | ? |
| `3c57f64f-24ae-4a25-bbe9-e037ce69c633` | Kit De Cable 4 Gauge Voyz Con Fusiblera Anl | `50-KIT4` | ? |
| `27e60a01-66b1-4591-8098-d843a7d17698` | Kit De Cable 8 Gauge Macars | `ST-8AWG` | ? |
| `dbd868ec-c42a-44f1-9ee7-263b1770b7bd` | Kit Nakamichi 6x9" Nse6917 500w + 6" Nse1617 400w | `NRS7927` | ? |
| `775b0f60-dac5-4df3-9db4-1aff23b9a136` | Modulo Reproductor Mp3/usb/bt/fm | `ES-317USB` | ? |
| `e3511394-1606-4605-957b-3d21a97f7d17` | Modulo Reproductor Usb/sd/fm/bt | `ES-320AUSB` | ? |
| `a946bee4-74dc-47a5-bef0-030f54d53578` | Multimedia Infinity Tech Vw Amarok 9" Android 10 2 Ram 32gb Carplay | `9003Q8` | ? |
| `49b0b285-2f82-406e-b7f7-b23e9f90f3ed` | Pantalla 7" Desmontable Bt Carplay Inalambrico Bcm-735 | `2214` | ? |
| `bbbea626-42bd-4840-ba08-0a51098c2b82` | Parlante 10" Alpine Subwoofer 250 Rms 4 Ohm | `W10S4` | ? |
| `92629b71-3ca4-4e2a-92cb-e9e6c10b0c09` | Parlante 10" Bomber One 200 Rms Subwoofer | `01.04.1980` | ? |
| `c1fc028a-b7a9-481e-8a56-6c08744214f8` | Parlante 10" Jbl Selenium 300 Rms Midbass | `10MG600` | ? |
| `848e4002-39ee-458e-8030-56fc4929ff46` | Parlante 10" Mid Bass Peavy | `PRO10` | ? |
| `e761910d-9ff1-434c-ac65-39e2d7850470` | Parlante 10" Yahro 200w | `RE1050` | ? |
| `d376cd78-2121-45ac-ada4-23551610917a` | Parlante 12" Alpine Subwoofer 250 Rms 4 Ohm | `W12S4` | ? |
| `4fadac6c-2d5b-48b9-a700-02f3f3f51779` | Parlante 12" Bomber Papa Trio 650 Rms D4 Woofer | `1.25.028` | ? |
| `75a7cd0f-794f-4c26-9be9-75965bf2c2d3` | Parlante 12" Bomber Subwoofer Carbon 250 Rms 4ohms | `01.04.0134` | ? |
| `baf673a9-2340-4f44-83b5-f88bd1a21d65` | Parlante 12" Hard Power 550 Rms 4 Ω | `HP550` | ? |
| `09acd910-7540-4cbd-8956-dfeb7d69950e` | Parlante 12" Hard Power 850 Rms 4 Ω | `HP850` | ? |
| `3fc19945-3be9-4439-9d06-323d8f4ae0b2` | Parlante 12" Jbl Selenium 550 Rms Woofer | `12PWPRO` | ? |
| `a7ccca24-ad45-4934-a992-04d04f5f41ad` | Parlante 12" Mid Bass Peavey 400w | `PRO12` | ? |
| `7e8fd0b5-eeac-47cb-af1e-19b5859c8979` | Parlante 12" Mid Bass Selenium 600w Rms | `12MB1200` | ? |
| `ece99d6f-42fc-47bb-9b94-ce9adeb68a4f` | Parlante 12" Pioneer Sub Chato 1500w | `TS-SW3002S4` | ? |
| `0eaf9ed2-9fa8-46c2-9ba5-0cffb4518821` | Parlante 12" Pioneer Subwoofer 1400w 400 Rms Doble Bobina | `TS-W300D4` | ? |
| `6b90e09e-4fdd-4c33-80b1-bc157041dd06` | Parlante 12" Spyder Usina 350 Rms 4+4 Ohms 1400w Subwoofer | `USINA` | ? |
| `fa157173-f6b8-4365-a470-2346e6cd833d` | Parlante 12" Strong 200w | `ST-W128` | ? |
| `363b498c-8f17-4cf1-99ee-4043c3f64f0b` | Parlante 12" Woofer Sony 1800w 420 Rms Bs | `XS-NW1200/Z1` | ? |
| `9ffad661-14bd-442c-b987-873a723d749b` | Parlante 12" Woofer Ultravox 550 Rms | `C55012/4` | ? |
| `04aecbb7-ad9c-4ef1-9506-c25f6c561792` | Parlante 15" 1500 Rms Subwoofer Tornado Carcaza De Aluminio 4 Ohm 3000 W Selenium Jbl | `15SWT3000` | ? |
| `40b770cf-ac69-40b8-afd6-75eb07d6373b` | Parlante 15" 1700 Rms Subwoofer Tornado 4 Ohm 3400 W Selenium Jbl | `15SWT3400` | ? |
| `4835dfe7-001c-4b40-b753-3b15529933ac` | Parlante 15" 600 Rms Subwoofer Bicho Papao Bobina Doble | `1.23.063` | ? |
| `d19c7bbc-e103-4321-bf26-2318bc7286c5` | Parlante 15" 600 Rsm Woofer Selenium Jbl | `15WS600` | ? |
| `6a2815d2-30f7-47d7-a65b-265634603b1d` | Parlante 15" Bomber Bicho Papao 1200w Rms 4 Ohms | `1.23.071` | ? |
| `d2f16613-3932-4a8f-8406-e4a60b48bc92` | Parlante 15" Hard Power 1450 Rms 4 Ohms | `HP1450G` | ? |
| `028a4b47-516d-4df7-a091-7c53b9114237` | Parlante 15" Strong 300w | `ST-W158` | ? |
| `be6bb4b4-1ede-4ce3-82ff-44559cb24941` | Parlante 18" Mid Bass Peavey 800w | `PRO18` | ? |
| `510db539-cb89-4393-9b1c-a10be8828eba` | Parlante 4" Blauline 80 W Bl-404 ( Por Unidad ) | `BL-404` | ? |
| `8a4e4a39-cd42-424c-a950-48d938496348` | Parlante 4" Bomber Par | `1.16.286` | ? |
| `f4114866-939f-4779-bf43-3cc890674dd4` | Parlante 5" Blauline 10w Bl-405 ( Pór Unidad ) | `6601` | ? |
| `66087940-2f6b-4715-9fef-f56010f6dbec` | Parlante 5" Blauline 4v 100w B1309f | `9073` | ? |
| `e3a4be46-7ee0-42a9-b25d-72d6f22a36f5` | Parlante 5" Bomber Cada Uno Full Range 40 Rms Sin Reja | `1.17.128` | ? |
| `3d847f40-43ee-40db-a676-892dead6dd3d` | Parlante 5" Bomber Par 50rms 1.17.144 | `9744` | ? |
| `3e722ba8-e28d-45c1-8bf0-d4d8624ab018` | Parlante 5" Bomber Triaxial 60 Rms 1.16.292 | `9741` | ? |
| `4b3c826f-9a59-44bb-ba03-e54280580609` | Parlante 5" Lanzar 2 Vías 60 Rms | `VX50S` | ? |
| `9a4dfeb4-6188-4dc8-8251-6fab52daa538` | Parlante 5" Pioneer 2 Vías 250 W | `TS-G1320F` | ? |
| `0874e4a1-bf41-4334-860e-50b18b2565f3` | Parlante 5" Positron 3v 50 Rms Sin Reja | `ATP-5030` | ? |
| `8be598a0-5222-49ab-81e7-3070394a2589` | Parlante 5" Strong 350w 3v | `ST-1342` | ? |
| `c6d4205d-78ff-4b6b-a15e-c9065703f8ce` | Parlante 5" Voyz / Dual - Cada Uno - Difusor / 80 Watts Max / 4 Ohm | `RD500` | ? |
| `70738744-f1cf-49b8-9f6b-fbc695edff67` | Parlante 5" Voyz 3 Vias 375 Watts | `VZ-A5110` | ? |
| `36e30ba4-8807-4334-9ca3-3975b5499a92` | Parlante 6.5" 6" Lanzar 2 Vías 90 Rms Slim | `VX60S` | ? |
| `69c658b4-0ef0-449e-b181-80eb35ec576d` | Parlante 6" Audiopipe Midrange Sellado / 250 Watts / 125rsm | `APMB-6SB` | ? |
| `9c3ecb7d-6b7a-4dab-9cc0-55fd3652355a` | Parlante 6" Blauline 130w Bl-1601n ( Pór Unidad ) | `6571` | ? |
| `ab837ade-a5f2-4573-97b6-7feeceac97c5` | Parlante 6" Bomber 3 Vias 60 Rms Par1.16.293 | `9530` | ? |
| `09ed3ad8-f4d4-457c-a502-fe8bd894ef98` | Parlante 6" Bomber Full Range 40 Rms Sin Reja 9743 | `1.17.145` | ? |
| `f140557e-4fc2-496f-ae78-99937790e9ed` | Parlante 6" Marino Pioneer 160w 30w Rms | `TS-MR1640` | ? |
| `e8a72755-db6b-48a0-a9aa-e2b6c4175fd3` | Parlante 6" Pioneer 200w 2v (6.5") | `TS-F1634R` | ? |
| `170f80c0-cbd1-44ee-a81d-bef5112eb71a` | Parlante 6" Pioneer 300w 2v (6.5") | `TS-G1620F` | ? |
| `a018234c-6e5d-4d22-9cd3-b7b95e576f68` | Parlante 6" Pioneer 4 Vías 350 W | `TS-A1688S` | ? |
| `691d788e-3626-45b9-b3dc-d75bcf49b654` | Parlante 6" Strong 450 W 3 V (6.5" ) | `ST-1642` | ? |
| `9641d289-31f8-4b17-9118-e0baae40a1d2` | Parlante 6x9" Pioneer 3 Vías 400 W | `TS-G6930F` | ? |
| `e1ab89ee-9bd4-4c0e-85da-428326bcd0ff` | Parlante 6x9" Strong 1000w 3v | `ST-6942` | ? |
| `a75b6da1-d1d9-40f0-b8a3-22553e1a7b69` | Parlante 6x9" Strong 2 Vias 500 Rms | `ST-P696` | ? |
| `b80c4b45-5f3c-466b-953e-5286a490e1e3` | Parlante 8" 250 Rms Selenium Jbl | `8MB4P` | ? |
| `74fc4b71-ad1a-4a4a-a3ee-c5c7a66e2e8a` | Parlante 8" 400 Rsm Woofer Bass Selenium Jbl | `8SW11A` | ? |
| `2e15fd99-86ec-44d2-8649-92ca5b110fd2` | Parlante 8" Mid Bass Xxx 400w | `XT-LS80` | ? |
| `e025dfbc-626d-451c-bba0-5233d9169301` | Parlante 8" Pioneer 700w 180 Rms | `TS-M800PRO` | ? |
| `cbea960c-5da3-4a7d-9e62-c5351b2e469f` | Parlante 8" Selenium Woofer 350 W 175 Rms | `8PW8` | ? |
| `fd23bc39-dabf-4215-8c2d-71dd1cc50f77` | Parlante 8" Strong 100w | `ST-W88` | ? |
| `01325b03-19e6-4881-aebb-c6ce9958b22d` | Parlante Hard Power 12" Hp3850 2 Ohm | `HP3850` | ? |
| `7217762b-0586-47e9-a95d-1280f0534627` | Parlante Woofer 15" Selenium Flex | `15SW14A` | ? |
| `f4ff9272-3da4-43a6-9794-94dd3aba7bba` | Potencia Stetsom 400 W 4 Ch Hl400.4 2 Ohms | `2052` | ? |
| `bd47678d-aa89-40c4-b2e6-388efdb78cc2` | Potencia Stetsom 800 Rms 4ch 8914 | `HL800.4` | ? |
| `90a0a89a-163d-4f05-80d7-fde21ebccb18` | Procesador Digital De Audio 4 Vias Stetsom | `STX-2448` | ? |
| `91b20881-73e3-4dee-a8ad-803920accba8` | Procesador Expert Px2 6 Canales | `PX2` | ? |
| `8ded465d-1b6b-4e55-9b46-7089f58f8498` | Reparo Driver Bd-250 D250 Economico | `BD-250R` | ? |
| `57d95a6c-ee95-479d-98de-891e6aaed03d` | Reparo Driver Blauline Bd-200 8 Ohms | `8216` | ? |
| `9e6b2f2d-8b5d-42f2-82fc-bc81075991e1` | Reparo Driver Bomber Db200 Modelo Anterior Spyder 7291 | `01.01.0190` | ? |
| `42cba379-7f5f-4901-b47f-f6185407ea67` | Reparo Driver Bomber Db200x 8 Ohms | `01.01.0271` | ? |
| `d6dc3d1f-2835-49da-9972-0c891c9d1f15` | Reparo Driver Selenium Jbl 400 / 405 | `RPD400` | ? |
| `6cff8897-c71c-456f-9d39-f902b94cee53` | Reparo Driver Selenium Jbl 405 Trio | `RPD405 TRIO` | ? |
| `215957c8-d8a0-49bf-aace-d0cc8df7af6a` | Reparo Driver Selenium Jbl 450ti Trio | `RPD450 TI TR` | ? |
| `eb0a940b-33cb-4a46-9254-fd8ba5dad9f6` | Reparo Driver Selenium Jbl D220ti | `RPD220TI` | ? |
| `d5f58287-c5b6-429c-a5a0-912d9bf2c6d6` | Reparo Driver Selenium Jbl Dh200 | `RPDH200` | ? |
| `80f7a4f5-e8cb-4483-b87d-5c0063387bed` | Reparo Driver Spyder Drv 400 | `REPARO-DRV400` | ? |
| `63fe047e-0fc3-4e84-921d-068184e34c1b` | Reparo Driver Voyz Ab15pss | `TU-2070` | ? |
| `d17cbcb0-5102-4092-81c9-15567c1d1e01` | Reparo Driver Voyz Vz60d | `TU-2520` | ? |
| `f7d3cfbe-b0c8-447f-adbe-b7af50a24640` | Reparo Tweeter Audiopipe | `ATV4061` | ? |
| `7be01ef9-c4c7-44d1-96af-98dc8fa563fa` | Reparo Tweeter Blauline Jbl Bt-400r 8148 | `REPBT-400/R` | ? |
| `f63a39c7-32da-4e6e-a152-f3bc80c9b9df` | Reparo Tweeter Bomber Stb350 Stb320 7880 | `01.01.0228` | ? |
| `46d4c540-8bac-4394-b3ea-f7fc85bdcc6b` | Reparo Tweeter Selenium Jbl St450 | `RPST450` | ? |
| `7cce939b-4a76-4c69-8be1-bfbfb3279a0b` | Reparo Tweeter Selenium St400 | `RPST400` | ? |
| `beb3f51b-daf2-4ccb-9849-85f78342fcf0` | Reparo Tweeter Spyder Stw 200 | `REPARO-STW200` | ? |
| `6c812a2a-c365-4597-a444-18ca8582ee7d` | Reparo Tweeter Tw46 | `TW46` | ? |
| `7f7e3e5e-f592-479a-aa46-925e74ff54e5` | Transmisor Bluetoot Bt Bt118 | `291` | ? |
| `73c1d57d-90ee-42a0-adec-916b7476ec88` | Tweeter Bala Blauline 150w | `BT-304` | ? |
| `ecde6c9a-8f74-4ef7-adf8-27f2afd4b64a` | Tweeter Bala Blauline 2" 400w | `BT-400` | ? |
| `56c0b8d8-1b30-4464-b988-70e9f2899dc5` | Tweeter Bala Bomber Stb 350 8ohms 7886 | `1.11.1932` | ? |
| `d9a1bc3d-d78b-4733-a983-decaec0bbde9` | Tweeter Blauline Ts-t120 8578 | `BT-120` | ? |
| `94d1a4da-0bb2-482f-a315-bdcf61b259ea` | Tweeter Bomber Con Luz 100 Rms 8 Ohms 8246 | `1.20.003` | ? |
| `b21f2c8b-a522-4791-8bd7-c20334b7e9ae` | Tweeter Bomber Neodimio 1" 60 Rms Upgrade (Par) 7799 | `1.49.010` | ? |
| `1d540df4-c13f-4bd4-83b7-a2e16d98d71f` | Tweeter Bomber Piezo Bl 20 80 Rms (Par) 7895 | `1.49.012` | ? |
| `c3475bde-771b-48ef-93e0-fb690fadebe8` | Tweeter Bomber Piezo Bl10 60 Rms (Par) 7894 | `1.49.011` | ? |
| `5d72dafd-69bb-4420-9f11-d15d8b331b4c` | Tweeter Cuadrado 150w 8.8 X 8.8 Cm | `HL 303` | ? |
| `652d930a-f8bd-46c5-bf0e-861284871efe` | Tweeter Rectangular 150w 5 3/8 X 2 3/4" At-205-1104 | `AT 205-1104` | ? |
| `cb227a90-ab1b-49c1-8bff-3605136dc419` | Tweeter Trooner 3"x 7" Rectangular 150 Watts | `AT202-1306` | ? |
| `d552052c-4d5d-4cbd-9155-d9953a66ff4d` | Voltimetro Strong De Audio Para Embutir 12v Reloj Termometro | `ST-VRT` | ? |
| `d98aa18d-7511-45c7-befd-7bec32187f95` | Y Griega Rca 1 Hembra 2 Macho | `ST-Y2M1F` | ? |
| `a9c52cb6-3720-46c6-ac96-62ee474a2390` | Y Griega Rca 1h / 2m Rca De Lujo Blauline 30 Cm | `KTA-047` | ? |
| `37f0409a-fe94-484d-b339-fb88c7325c65` | Y Griega Rca 2m / 1h Rca Blauline 30 Cm | `MK-047` | ? |
| `82b13027-5f9a-4bf1-9780-84227e1b1c6d` | Y Griega Rca Strong 2 Hembra 1 Macho | `ST-YHE` | ? |
| `91e52542-6151-40cd-8d40-623cfab046fa` | Y Griega Rca Strong 2 Macho 1 Hembra | `ST-YMA` | ? |

| **SQL — Renombrar productos** |
|---|---|
_No se requieren renombres en esta categoría._

---

### 4. Limpieza y Detailing

**SQL — Crear categoría:**
```sql
INSERT INTO category (id, name, description, color, "sortOrder", "isActive")
VALUES ('cat-limpieza', 'Limpieza y Detailing', 'Productos de limpieza automotriz: shampoos, ceras, limpiadores, acondicionadores, selladores cerámicos, paños, microfibras', '#10B981', 4, true);
```

**SQL — Asignar productos a esta categoría:**
```sql
UPDATE product SET "categoryId" = 'cat-limpieza' WHERE id IN (
  'f1b78fde-d656-4d9f-aab7-f503955d1788',
  'prod-1778536189968-tbfpfai68',
  '2e737f5d-bae6-4ec8-9ea5-608a43ff4789',
  'prod-1778536954646-6kqk4d2ec',
  '3e34eb96-6355-40f3-95f9-4b172f11c7cf',
  '4c3493b4-5f11-4dbb-8cba-0e0f08c21eda',
  '4fa87df8-985e-4e97-937a-ac9f419066aa',
  '2593f13f-03fc-41c4-86a2-6a3649bbc4b4',
  '233a94aa-d973-4d9a-be58-1b59cbc6088b',
  'prod-1781181463620-1dw85qjdl',
  'prod-1783010557713-gtq3tswu0',
  'prod-1783008647620-gwooyje1s',
  'e042f8e1-b3e6-4fc0-8da8-9a88ab4219f1',
  'prod-1783008144104-wgpx0kg21',
  '549e293f-76f4-4bc2-b17d-9eb58ff0ea9f',
  'prod-1783007390762-dxl67wwhy',
  '6546cb8b-30ce-4944-bb5c-f0f9d1b5605a',
  'e0d0007f-91bb-479f-813e-59efb86f5c69',
  'prod-1783008084254-g4o2bk4o3',
  'prod-1783007122797-mpnrrexsf',
  'prod-1783007924783-01d52n6m2',
  'prod-1783008220169-lvg92xhe8',
  'prod-1783007485662-3rh6hn57r',
  '4981e651-fff1-4e8f-8c38-0465ba209826',
  'prod-1783009133797-v2r2is0ep',
  'prod-1783007760449-ik6ygk6r5',
  'prod-1783007853902-hp7shikf0',
  'f41ce9d7-e7e2-4f5f-8f09-c81f251349fb',
  'prod-1783007689027-mo990pcr6',
  'prod-1783007998350-fu6npr62h',
  'prod-1778537109652-pm8runq9m',
  '4e831349-3416-4206-99b2-c1d5888a5b89',
  'f838bbb0-91d8-4c3a-9f07-122ae19d05e2',
  '4bb9c761-7077-4b71-864f-16d3e6d185f7',
  '7e6a34e0-6ebc-43fb-bb21-e6470d30688c',
  '2b44c30f-2003-4a42-8acd-8115f4dec237',
  'prod-1781101847997-cs0pfgp1i',
  'prod-1778536676691-cigvxy5co',
  'c089b494-9ea3-4d8a-aa54-5ecc3612350e',
  'prod-1778536053822-oyr0x5slc',
  '02464cd0-b92a-408c-bcc2-2217da690183',
  '83f05d2c-1544-44d0-bfe6-ac58f4d56a53',
  '43918fc8-3282-420b-a605-872d72fd283b',
  '284ed9d8-a184-4f89-b08e-efd732fb5d2b',
  'e2e24311-204b-4e7b-afae-ddecb0ad7590',
  'efc8e0b8-380d-49f9-9db6-72eb8ba66f2f',
  '561aabf0-e2d4-4a06-8f96-6496f997484f',
  'f6de9174-370f-4c72-a4e1-a16d94ec5e6d',
  'prod-1778535613601-volvikmj7',
  '0bd54a9f-9005-4562-bee2-dbb936f05e27',
  'a84cc8e5-5c93-47d6-809f-bd7ac4dd8157',
  'ab0883e6-0534-4fd0-831e-f651c9d65cb2',
  'prod-1778537072948-5x08qys54',
  'bbfe43ad-7163-448f-8cdc-6ebcd2eaffe5',
  'a041f64a-e57e-4497-ac19-736e4093578a',
  '296dea69-8843-4408-b1d5-9db01947b8a6',
  'eab652f5-7efe-432c-9fd6-20b3836fe1cc',
  '16d30216-b8e1-4893-ba23-1ca7d5058ad8',
  '56a437f2-f407-4d99-b1e3-4dc62e4eaf46',
  'prod-1778537161428-iq2ze4p7z',
  'prod-1778536321891-douwin1v9',
  'prod-1778536865120-l1twy4jrp',
  '3a86c5a2-d687-4c6d-9611-c18a035fd995',
  '2565b0db-06ff-4e93-8e64-0c24cd8ff8b7',
  '56271043-7a44-495b-b883-c58c3ec4a654',
  '219edc37-3af0-491c-a167-a74e4c2686a7',
  'f5248135-7007-4790-97bc-06411403dd6e',
  '8100c572-697f-4a02-ae99-eceac7386571',
  '10ee9d03-190e-425a-bd0b-07204f366cd1',
  'f4eef66d-a4ac-498c-8ce6-b09de2aa3b8d',
  'prod-1778536444924-288uazjcs',
  '3c9b8b03-8ff6-441c-ab85-480a3586c094',
  '53f24316-ec38-4c35-9974-f4682f84ca75',
  '44248a18-a22b-4382-9da0-eb23f71b236c',
  '7bb8249b-d281-4138-9f0c-9aec5a5bbd38',
  '4c3ad49c-1e37-4d0b-82c3-fd40121ee2ae',
  '8bbfbee3-a8d3-42a6-9af1-66e1083bda29',
  'prod-1778536130731-5bzjs0qab',
  '852ccc16-c679-468f-821d-46c4f2c8436a',
  'prod-1778536490718-59aw8zvxe',
  'a6246128-4975-4066-997c-e3405fec2692',
  '3bc2bdfd-26ea-4bcf-8120-ac4207dc1050',
  '22bdd1de-4eac-429e-ba5c-926427998ec7',
  '0122ed8e-a734-4de5-8de2-89c5be9bb443',
  'bf74a625-95d6-4c01-ab62-850db3687311',
  'prod-1778535020506-3oouyqg1d',
  '6ca313f3-bcec-47cd-968e-fd1417082ef2',
  '038e902c-c7b5-4b7b-84a1-9c2ed96088e6',
  '5e4507a5-2283-435b-b348-9d02e037bf1b',
  '4733728f-66eb-4e09-9b4b-97b602530d6e',
  '744d03a3-e8dc-4c1d-97cf-68cee17d0635',
  'f2b0ae03-4cfb-4cc5-9644-09c733ca1f1a',
  '14839d46-23a8-45a3-9acf-9eea867f3b1b',
  'prod-1778535834986-b2uxlqp2g',
  'prod-1778536544521-5yq152onk',
  '964521ab-0a20-4687-847e-8eee555921a8',
  '4a915c2a-ba72-4c0e-9733-7b7d7d57c6b1',
  'prod-1778536588571-pajj13sz9',
  '583ff881-396f-44e4-86ba-353902a514b1',
  '3310feb5-bd76-494d-bf44-dfa8ccb1e167',
  '1bdc917f-fb90-4581-9c1c-5781b5a70fe6',
  'b4063539-1957-41c6-a508-76cfcada8bef',
  'ff79cf13-d822-4961-ace1-6ac7d0e40542',
  '7ad8df3d-c086-41ef-87da-ddba38852696',
  'b3cca854-070e-45a4-a010-266c1bb0800f',
  '5bf04aa7-cdd9-4aa3-812f-7536bff7a783',
  '2f896b9d-5249-48b0-8a80-78b1d9cdb6a1',
  '887dd802-c343-4e6a-bf51-deb5a00a99bc',
  '714e506c-d3ee-4cae-86fa-e2cacae5a202',
  '6511e244-7076-4acf-9f67-60dd9c069d8e',
  'prod-1782596636073-lcv2uuekl',
  '59819dd2-18a1-4bc6-abbb-e336113fd900',
  'e96c5d33-3484-49b0-8216-ef8ecb5f6f4c',
  'prod-1778536002530-gzdtki41s',
  '339a6029-6043-4237-a9c3-4afc2329acbb',
  'c4d829c6-2057-4f16-b40c-ba9beb3108f8',
  'dbaab415-da42-4b5a-8351-9c7410027d88',
  '1611096b-3742-46bc-a240-b047e71cfbfd',
  '9f26387e-71c4-4f5d-bf45-4914b96debd1',
  'e5d539f3-c602-4fd0-bd6b-4d6be2ec962c',
  'c66a47bd-bac3-47b4-bbd2-f5d764c4238f',
  'f7025bc3-7421-42de-a973-3be8148c0332',
  'f0d5b9ce-5663-4c35-bd11-130f13e176b4',
  '6e78ba0c-6783-4df6-8904-3f2ca11f82b6',
  'c5f6d510-0eb3-4173-baac-04adc79b8381',
  'prod-1782736683821-mq3ikdpw2',
  '9629a3c4-ab4b-488e-bcb8-b3b68ae427c5',
  '4e9a6fa0-2159-40dc-b077-1aef8fc82485',
  '5833fba8-5592-42d8-9f0c-69985d159baa',
  '4ee5b3ba-aff9-4766-847c-3bd9c269e679',
  '294e9263-32c9-4e08-b5eb-14fb5109e102',
  'd374336d-8c6f-4598-b1f6-73dd12fe4021',
  '87eaf0ac-9a6d-4fd8-8a12-d0d0e8d94fee',
  '187a29cc-b2a4-41b0-8d76-37ad8c938d4d',
  'cd2fc285-3bf0-483b-b0b9-2a51f2528f20',
  '523b42e3-6a07-450f-bda3-fbd50cb3cb46',
  'bc6d9e27-72b9-4322-a1e2-bba7ba261026',
  'a58f6a4a-68e8-4f3f-85e8-cac894a485c3',
  '8f9d165c-0440-4244-bf8c-5602356e4fb6',
  '1b7edd5a-be7c-4c24-aa28-c2d6d07fb786',
  '49ed1f51-82f9-4092-95a1-970c9ca3bfc8',
  'prod-1778534596724-ap8p0zl6w',
  'prod-1778534594998-lq8e2s21q',
  'prod-1778534596117-r61ann076',
  'prod-1778534594072-kgycq6cr5',
  'prod-1778534596840-5k6suac1b',
  'prod-1778534596220-h3htafvih',
  'prod-1778534596345-36vp3asmu',
  '6a7392c5-ca34-4013-a528-fe5af4bc778e',
  '488ce96a-cdda-4c46-ad12-4774351ccdca',
  '7ec57457-8ded-4bf7-bb18-ba5e8a07a5db',
  '66ba28f6-dc2e-4f82-9f60-619ae009963f',
  'prod-1778535378289-8k6euvk2q',
  '61f4e72d-cc97-401c-96bc-74b4ae66b498',
  'prod-1778535558415-3m9tzpndc',
  'c01404a2-8f1a-498e-ab8b-b5451ec638d6',
  'a4337e85-7e2d-4fb1-88bf-fd11a08fd255',
  '05fdf863-8b25-4499-920f-caea154b2dd4',
  'prod-1782143938916-lz6dedh5i',
  '22f40d7e-3dbe-496d-9788-2c18031c5138',
  'e56ae34a-23d7-4579-87be-a0c2665b9fe3',
  '7b926222-37a3-4ad0-a333-57585b0afced',
  '74138f2a-a532-4f37-a7b6-879b1c069f1c',
  'ad92e934-37e9-4390-b992-ac279275c1c8',
  '511621b0-874c-4d85-852f-0c30b45d487a',
  'c985a32b-6dce-4a7c-945b-e968d96af4e2',
  '30574f59-8f7d-4bf6-9e45-d1fc72f84d56',
  'a3bb789c-d8d7-417d-8eec-521bbc2aeccc',
  '6b5f8f9a-2efc-46b8-85a0-05bf9519e366',
  '58b7e471-825f-4696-99ce-eaab31cb76fc',
  'a95ec8bf-2d41-4205-81dc-745eb8449734',
  '25369121-157b-44eb-8fdb-44816fc2eb26',
  'cb8724f2-19b3-4884-ae69-f4bf42c32b47',
  'prod-1778536731848-ab3a6e306',
  'prod-1778536778814-czk8q4oqu',
  '98ccec4d-b93d-47b4-8eb2-5084c135edbd',
  '9c598b59-755c-48b8-8feb-f4116313bd4d',
  '2d82a966-f759-4b70-81ff-20232c6b44d5',
  '36274af5-d1c2-4778-8fc2-034df16e86fa'
);
```

**Productos (179):**

| ID | Nombre actual | SKU | Stock | Sugerencia |
|---|---|---|---|---|
| `f1b78fde-d656-4d9f-aab7-f503955d1788` | Acondicionador De Cueros Trim Leather Toxic Shine De Base Acuosa 600 Ml | `TS022900TL` | ? | |
| `prod-1778536189968-tbfpfai68` | ALCALINE WHELLS TOXIC SHINE LIMPIADOR ALCALINO 600 ML | `PRD-1778536189968-OZ7LF` | ? | ⚠️ → "Alcaline Whells Toxic Shine Limpiador Alcalino 600 ML" *(ALL CAPS name)* |
| `2e737f5d-bae6-4ec8-9ea5-608a43ff4789` | All Clean Limpiador Multiuso Toxic Shine 600 Ml | `TS0010900AC` | ? | |
| `prod-1778536954646-6kqk4d2ec` | ALL IN ONE TOXIC SHINE RESTAURA Y DA BRILLO 600 ML | `PRD-1778536954646-QN9AX` | ? | ⚠️ → "ALL IN ONE Toxic Shine Restaura Y DA Brillo 600 ML" *(ALL CAPS name)* |
| `3e34eb96-6355-40f3-95f9-4b172f11c7cf` | American Shine Toxic Shine Quick Detailer 600 Ml | `TS-0129124AS` | ? | |
| `4c3493b4-5f11-4dbb-8cba-0e0f08c21eda` | Aromatizante Bubble Gum Toxic Shine | `7618` | ? | |
| `4fa87df8-985e-4e97-937a-ac9f419066aa` | Aromatizante Champak Toxic Shine | `7622` | ? | |
| `2593f13f-03fc-41c4-86a2-6a3649bbc4b4` | Aromatizante Dark Secret Toxic Shine | `7617` | ? | |
| `233a94aa-d973-4d9a-be58-1b59cbc6088b` | Aromatizante Limon Toxic Shine | `7621` | ? | |
| `prod-1781181463620-1dw85qjdl` | AROMATIZANTE UVA TOXIC SHINE | `7619` | ? | ⚠️ → "Aromatizante UVA Toxic Shine" *(ALL CAPS name)* |
| `prod-1783010557713-gtq3tswu0` | AROMATIZANTE VAINILLA TOXIC SHINE | `PRD-1783010557712-8B7RV` | ? | ⚠️ → "Aromatizante Vainilla Toxic Shine" *(ALL CAPS name)* |
| `prod-1783008647620-gwooyje1s` | ATOMIZADOR BOSS TOXIC SHINE 120 ML | `PRD-1783008647620-KXRWR` | ? | ⚠️ → "Atomizador Boss Toxic Shine 120 ML" *(ALL CAPS name)* |
| `e042f8e1-b3e6-4fc0-8da8-9a88ab4219f1` | Atomizador Bubblegum Toxic Shine 120 Ml | `BUBBLEGUM` | ? | |
| `prod-1783008144104-wgpx0kg21` | ATOMIZADOR CANDY CARAMELO DE BANANA TOXIC SHINE 120 M | `PRD-1783008144104-PC6NL` | ? | ⚠️ → "Atomizador Candy Caramelo DE Banana Toxic Shine 120 M" *(ALL CAPS name)* |
| `549e293f-76f4-4bc2-b17d-9eb58ff0ea9f` | Atomizador Candy Caramelo De Banana Toxic Shine 120 Ml | `CANDY BANANA` | ? | |
| `prod-1783007390762-dxl67wwhy` | ATOMIZADOR CHERRY TOXIC SHINE 120 ML | `PRD-1783007390762-UYH58` | ? | ⚠️ → "Atomizador Cherry Toxic Shine 120 ML" *(ALL CAPS name)* |
| `6546cb8b-30ce-4944-bb5c-f0f9d1b5605a` | Atomizador Coffe Toxic Shine 120 Ml | `COFFE` | ? | |
| `e0d0007f-91bb-479f-813e-59efb86f5c69` | Atomizador Energy Toxic Shine 120 Ml | `ENERGYATOM` | ? | |
| `prod-1783008084254-g4o2bk4o3` | ATOMIZADOR INVICTUS TOXIC SHINE 120 ML | `PRD-1783008084254-P6GY5` | ? | ⚠️ → "Atomizador Invictus Toxic Shine 120 ML" *(ALL CAPS name)* |
| `prod-1783007122797-mpnrrexsf` | ATOMIZADOR LADY TOXIC SHINE 120 ML | `PRD-1783007122796-AQY53` | ? | ⚠️ → "Atomizador Lady Toxic Shine 120 ML" *(ALL CAPS name)* |
| `prod-1783007924783-01d52n6m2` | ATOMIZADOR LEMON MINT FRESH TOXIC SHINE 120 ML | `PRD-1783007924783-WC1P5` | ? | ⚠️ → "Atomizador Lemon Mint Fresh Toxic Shine 120 ML" *(ALL CAPS name)* |
| `prod-1783008220169-lvg92xhe8` | ATOMIZADOR MANGO GO TOXIC SHINE 120 ML | `PRD-1783008220169-AYDQJ` | ? | ⚠️ → "Atomizador Mango GO Toxic Shine 120 ML" *(ALL CAPS name)* |
| `prod-1783007485662-3rh6hn57r` | ATOMIZADOR NEW CAR TOXIC SHINE 120 ML | `PRD-1783007485662-BXU1C` | ? | ⚠️ → "Atomizador NEW CAR Toxic Shine 120 ML" *(ALL CAPS name)* |
| `4981e651-fff1-4e8f-8c38-0465ba209826` | Atomizador Party Summer Toxic Shine 120 Ml | `PARTY` | ? | |
| `prod-1783009133797-v2r2is0ep` | ATOMIZADOR ROCKET POWER TOXIC SHINE 120 ML | `PRD-1783009133797-SI6JB` | ? | ⚠️ → "Atomizador Rocket Power Toxic Shine 120 ML" *(ALL CAPS name)* |
| `prod-1783007760449-ik6ygk6r5` | ATOMIZADOR SNEAKERS TOXIC SHINE 120 ML | `PRD-1783007760449-9L7EG` | ? | ⚠️ → "Atomizador Sneakers Toxic Shine 120 ML" *(ALL CAPS name)* |
| `prod-1783007853902-hp7shikf0` | ATOMIZADOR SWEET FRUTY TOXIC SHINE 120 M | `PRD-1783007853902-KP7L1` | ? | ⚠️ → "Atomizador Sweet Fruty Toxic Shine 120 M" *(ALL CAPS name)* |
| `f41ce9d7-e7e2-4f5f-8f09-c81f251349fb` | Atomizador Sweet Fruty Toxic Shine 120 Ml | `SWEET FRUTY` | ? | |
| `prod-1783007689027-mo990pcr6` | ATOMIZADOR UVA TOXIC SHINE 120 ML | `PRD-1783007689027-DNGK9` | ? | ⚠️ → "Atomizador UVA Toxic Shine 120 ML" *(ALL CAPS name)* |
| `prod-1783007998350-fu6npr62h` | ATOMIZADOR WANAWE TOXIC SHINE 120 ML | `PRD-1783007998350-8M3TC` | ? | ⚠️ → "Atomizador Wanawe Toxic Shine 120 ML" *(ALL CAPS name)* |
| `prod-1778537109652-pm8runq9m` | BACK TO BLACK TOXIC SHINE 600 ML (REVITALIZADOR DE SUPERFICIES PLATICAS PARA AUTO) | `PRD-1778537109652-LZ73L` | ? | ⚠️ → "Back TO Black Toxic Shine 600 ML (Revitalizador DE Superficies Platicas Para Auto)" *(ALL CAPS name)* |
| `4e831349-3416-4206-99b2-c1d5888a5b89` | Backing Plate 3" Plato Para Pad Economico | `6589` | ? | |
| `f838bbb0-91d8-4c3a-9f07-122ae19d05e2` | Backing Plate 5" Plato Perforado Autocare | `7477` | ? | |
| `4bb9c761-7077-4b71-864f-16d3e6d185f7` | Bacterial Remover Drop D | `125ML` | ? | |
| `7e6a34e0-6ebc-43fb-bb21-e6470d30688c` | Blue Magic Acondicionador De Plasticos Exterior Brillante Toxic Shine | `TS1130425TLR` | ? | |
| `2b44c30f-2003-4a42-8acd-8115f4dec237` | Bolso Kit Seguridad (Bolso,juego 2 Balizas, Chaleco, Botiquin, Manta, Par Guantes, Microfibra, Linga) | `BOLSOSEG` | ? | ⚠️ *Requiere renombre manual (nombre >100 caracteres)* |
| `prod-1781101847997-cs0pfgp1i` | CANDY CREAM TOXIC SHINE ACONDICIONADOR DE PLASTICOSY GOMAS EXTERIOR A BASE ACUOSA 600 ML | `TS0010500CC` | ? | ⚠️ → "Candy Cream Toxic Shine Acondicionador DE Plasticosy Gomas Exterior A Base Acuosa 600 ML" *(ALL CAPS name)* |
| `prod-1778536676691-cigvxy5co` | CANDY CREAM TOXIC SHINE ACONDICIONADOR DE PLASTICOSY GOMAS EXTERIOR A BASE ACUOSA 600 ML | `PRD-1778536676691-D9RMO` | ? | ⚠️ → "Candy Cream Toxic Shine Acondicionador DE Plasticosy Gomas Exterior A Base Acuosa 600 ML" *(ALL CAPS name)* |
| `c089b494-9ea3-4d8a-aa54-5ecc3612350e` | Carnauba Pure Wax Toxic Shine Cera En Pasta Carnauba | `CARNAUBA CERA` | ? | |
| `prod-1778536053822-oyr0x5slc` | CAUCHO PARA CUBIERTA DARK FLUID TOXIC SHINE 600 ML | `PRD-1778536053822-K3EU2` | ? | ⚠️ → "Caucho Para Cubierta Dark Fluid Toxic Shine 600 ML" *(ALL CAPS name)* |
| `02464cd0-b92a-408c-bcc2-2217da690183` | Caucho Para Cubierta Gelshine Toxic Shine Gel De Brillo Intenso 250 Ml | `TSM999001GS` | ? | |
| `83f05d2c-1544-44d0-bfe6-ac58f4d56a53` | Caucho Para Cubiertas Gelshine Toxic Shine Gel De Brillo Intens 600 Ml | `TS0010100GS` | ? | |
| `43918fc8-3282-420b-a605-872d72fd283b` | Cepillo De Goma Sacapelo Triangulo | `DM-117` | ? | |
| `284ed9d8-a184-4f89-b08e-efd732fb5d2b` | Cepillo De Microfibra | `7375` | ? | |
| `e2e24311-204b-4e7b-afae-ddecb0ad7590` | Cepillo Microfibra Rejillas De Aire | `7574` | ? | |
| `efc8e0b8-380d-49f9-9db6-72eb8ba66f2f` | Cera Crema Toxic Shine Mystic Seal Resalta Y Brillo De La Pintura 600 Ml | `TS0990999MS` | ? | |
| `561aabf0-e2d4-4a06-8f96-6496f997484f` | Cera Liquida Cherry Quick Toxic Shine Quick Detailer 600 Ml | `TS0216773CQ` | ? | |
| `f6de9174-370f-4c72-a4e1-a16d94ec5e6d` | Cera Liquida Extreme Detail Toxic Shine Quick Detailer | `TS00450140ED` | ? | |
| `prod-1778535613601-volvikmj7` | CERA LIQUIDA LAVISH TOXIC SHINE HYBRID WAX 600 ML | `PRD-1778535613601-IDAPK` | ? | ⚠️ → "Cera Liquida Lavish Toxic Shine Hybrid WAX 600 ML" *(ALL CAPS name)* |
| `0bd54a9f-9005-4562-bee2-dbb936f05e27` | Cera Liquida Luxury Toxic Shine Carnauba Blend 600 Ml | `32812` | ? | |
| `a84cc8e5-5c93-47d6-809f-bd7ac4dd8157` | Cera Liquida The Boss Shine Toxic Shine 600 Ml | `BOSSSHINE` | ? | |
| `ab0883e6-0534-4fd0-831e-f651c9d65cb2` | Clay Club Toxic Shine Lubricante Para Claybar 600 Ml | `20001` | ? | |
| `prod-1778537072948-5x08qys54` | CLEAN STUFF TOXIC SHINE 360 GR AEROSOL | `PRD-1778537072948-OK7TM` | ? | ⚠️ → "Clean Stuff Toxic Shine 360 GR Aerosol" *(ALL CAPS name)* |
| `bbfe43ad-7163-448f-8cdc-6ebcd2eaffe5` | Clean Vision Toxic Shine Limpiador De Vidrios 600 Ml | `TS0020600CV` | ? | |
| `a041f64a-e57e-4497-ac19-736e4093578a` | Cono 3" Pad Para Tadadro | `198` | ? | |
| `296dea69-8843-4408-b1d5-9db01947b8a6` | Cream Dressing Drop D (Condicionador De Plastico) | `468248472` | ? | |
| `eab652f5-7efe-432c-9fd6-20b3836fe1cc` | Cream Wax Drop D Black Label (Cera En Crema ) | `468248470` | ? | |
| `16d30216-b8e1-4893-ba23-1ca7d5058ad8` | Creme Look Toxic Shine (Acondicionador Plasticos Interior) | `TS8872361` | ? | |
| `56a437f2-f407-4d99-b1e3-4dc62e4eaf46` | Creme Wax Banana Toxic Shine Cera Carnauba 600 Ml | `TS003005CW` | ? | |
| `prod-1778537161428-iq2ze4p7z` | CRISTAL TITANIUM TOXIC SHINE 30 ML VIDRIO LIQUIDO SELLADOR CERAMICO | `PRD-1778537161428-7Z3JX` | ? | ⚠️ → "Cristal Titanium Toxic Shine 30 ML Vidrio Liquido Sellador Ceramico" *(ALL CAPS name)* |
| `prod-1778536321891-douwin1v9` | CTRL-Z TOXIC SHINE 600ML (LIMPIADOR MULTIUSO) | `PRD-1778536321891-MNDI3` | ? | ⚠️ → "Ctrl-Z Toxic Shine 600ml (Limpiador Multiuso)" *(ALL CAPS name)* |
| `prod-1778536865120-l1twy4jrp` | DARK COLORS ABRILLANTADOR COLORES OSCUROS 600ML | `PRD-1778536865120-1RZ57` | ? | ⚠️ → "Dark Colors Abrillantador Colores Oscuros 600ml" *(ALL CAPS name)* |
| `3a86c5a2-d687-4c6d-9611-c18a035fd995` | Dressing Soft Drop D (Acondicionador De Superficie) | `468248451` | ? | |
| `2565b0db-06ff-4e93-8e64-0c24cd8ff8b7` | Dressing Soft Drop D Black Label (Acondicionador De Superficie Mate) | `468248463` | ? | |
| `56271043-7a44-495b-b883-c58c3ec4a654` | Energy Seal Toxic Shine ( Cera Liquida Spray ) 600ml | `TS7784360ES` | ? | |
| `219edc37-3af0-491c-a167-a74e4c2686a7` | Energy Trim Toxic Shine ( Acondicionador De Plasticos Interior Brillante) | `TS7314955` | ? | |
| `f5248135-7007-4790-97bc-06411403dd6e` | Esponja Amarilla 19x9x5 | `LM-025` | ? | |
| `8100c572-697f-4a02-ae99-eceac7386571` | Esponja De Microfibra 21x12 Soft | `LM-020` | ? | |
| `10ee9d03-190e-425a-bd0b-07204f366cd1` | Finish Toxic Shine Abrillantador 600 Ml | `TS0009899FH` | ? | |
| `f4eef66d-a4ac-498c-8ce6-b09de2aa3b8d` | Formule Conquest Toxic Shine Limpiador Desengrasante De Llantas Y Motores 600 Ml | `TS0040500FQ` | ? | |
| `prod-1778536444924-288uazjcs` | FRUTY CREAM TOXIC SHINE ACONDICIONADOR DE PLASTICOS INTERIOR Y EXTERIOR . RESTAURA EL COLOR 600 ML | `PRD-1778536444924-97DEC` | ? | ⚠️ → "Fruty Cream Toxic Shine Acondicionador DE Plasticos Interior Y Exterior . Restaura EL Color 600 ML" *(ALL CAPS name)* |
| `3c9b8b03-8ff6-441c-ab85-480a3586c094` | Glass Cleaner Drop D (Limpiador De Vidrio) | `468248461` | ? | |
| `53f24316-ec38-4c35-9974-f4682f84ca75` | Graphic Wax Drop D (Cera Para Vinilosbrillantes O Satinados) | `468248474` | ? | |
| `44248a18-a22b-4382-9da0-eb23f71b236c` | Graphic Wax Drop D Black Label (Cera Rapida Vinilos Mate) | `468248475` | ? | |
| `7bb8249b-d281-4138-9f0c-9aec5a5bbd38` | Guante Hand Wash Toxic Shine | `HAND WASH` | ? | |
| `4c3ad49c-1e37-4d0b-82c3-fd40121ee2ae` | Guante Manopla De Lana 20x26 | `LM-024` | ? | |
| `8bbfbee3-a8d3-42a6-9af1-66e1083bda29` | Hells Toxic Shine 250 Ml Revitalizador De Cubiertas Y Plasticos Exteriores | `TSM999007HE` | ? | |
| `prod-1778536130731-5bzjs0qab` | HELLS TOXIC SHINE REVITALIZADOR DE CUBIERTAS Y PLASTICOS EXTERIORES 600ML  | `PRD-1778536130731-M0QGY` | ? | ⚠️ → "Hells Toxic Shine Revitalizador DE Cubiertas Y Plasticos Exteriores 600ml " *(ALL CAPS name)* |
| `852ccc16-c679-468f-821d-46c4f2c8436a` | Hits Bones Toxic Shine Protector De Pasaruedas Y Chasis 600 Ml | `TS0200851` | ? | |
| `prod-1778536490718-59aw8zvxe` | HOLY GLOSS TOXIC SHINE ACONDICIONADOR DE PLASTICOS INTERIORES Y EXTERIORES EN CREMA 600 ML | `PRD-1778536490718-C7B52` | ? | ⚠️ → "Holy Gloss Toxic Shine Acondicionador DE Plasticos Interiores Y Exteriores EN Crema 600 ML" *(ALL CAPS name)* |
| `a6246128-4975-4066-997c-e3405fec2692` | Ilussion Wax Toxic Shine Cera Carnauba 600 Ml | `TS0200800IW` | ? | |
| `3bc2bdfd-26ea-4bcf-8120-ac4207dc1050` | Infierno Gel Toxic Shine Apc Limpiador 600 Ml | `TS00950500IG` | ? | |
| `22bdd1de-4eac-429e-ba5c-926427998ec7` | Interior Renewer Drop D Black Label (Renovador De Interior ) | `468248464` | ? | |
| `0122ed8e-a734-4de5-8de2-89c5be9bb443` | Iron Warning Toxic Shine Limpiador Ferrico De Llantas 600 Ml | `TS0370999IW` | ? | |
| `bf74a625-95d6-4c01-ab62-850db3687311` | Kit Limpieza X 6 Pzas | `GY-2878` | ? | |
| `prod-1778535020506-3oouyqg1d` | Lavado  | `PRD-1778535020506-KX1Z2` | ? | |
| `6ca313f3-bcec-47cd-968e-fd1417082ef2` | Leather Cleaner Drop D (Limpiador De Cueros) | `468248468` | ? | |
| `038e902c-c7b5-4b7b-84a1-9c2ed96088e6` | Leather Dressing Drop D Black Label (Acondicionador De Cueros) | `468248469` | ? | |
| `5e4507a5-2283-435b-b348-9d02e037bf1b` | Light Colors Abrillantador Colores Claros 600ml | `TS1214855LC` | ? | |
| `4733728f-66eb-4e09-9b4b-97b602530d6e` | Limpia Cristales Gatillo Revigal X 650 Cm | `7790911000413` | ? | |
| `744d03a3-e8dc-4c1d-97cf-68cee17d0635` | Limpia Inyector Diesel Stp 236 Ml | `STP-05` | ? | |
| `f2b0ae03-4cfb-4cc5-9644-09c733ca1f1a` | Limpia Llantas Revigal X 650cc | `LIMPIA LLANTAS` | ? | |
| `14839d46-23a8-45a3-9acf-9eea867f3b1b` | Limpiador De Insectos Bug Remover Toxic Shine 600 Ml | `TS1529133BR` | ? | |
| `prod-1778535834986-b2uxlqp2g` | LIMPIADOR QUITA BREA X TAR TOXIC SHINE 600 ML | `PRD-1778535834986-LC83W` | ? | ⚠️ → "Limpiador Quita Brea X TAR Toxic Shine 600 ML" *(ALL CAPS name)* |
| `prod-1778536544521-5yq152onk` | MANGO GO TOXIC SHINE (ACONDICIONADOR PLASTICOS INTERIOR) | `PRD-1778536544521-QQFD9` | ? | ⚠️ → "Mango GO Toxic Shine (Acondicionador Plasticos Interior)" *(ALL CAPS name)* |
| `964521ab-0a20-4687-847e-8eee555921a8` | Manopla Goodyear Microfibra Grande Rastas | `GY-2854` | ? | |
| `4a915c2a-ba72-4c0e-9733-7b7d7d57c6b1` | Manopla Iael Microfibra | `LM-003` | ? | |
| `prod-1778536588571-pajj13sz9` | MASH MELON TOXIC SHINE ACONDICIONADOR DE PLASTICOS Y GOMAS EXTERIOR E INTERIOR DE BASE ACUOSA 600 ML | `PRD-1778536588571-CNJZ2` | ? | ⚠️ → "Mash Melon Toxic Shine Acondicionador DE Plasticos Y Gomas Exterior E Interior DE Base Acuosa 600 ML" *(ALL CAPS name)* |
| `583ff881-396f-44e4-86ba-353902a514b1` | Meguiars Classic Cleaner Wax Liquid X 473 Ml (Cera Liquida) | `A1216EU` | ? | |
| `3310feb5-bd76-494d-bf44-dfa8ccb1e167` | Meguiars Classic Engine Dressing Spray X 473ml (Abrillantador De Motor, Remueve Suciedad De Plasticos) | `G17316EU` | ? | ⚠️ *Requiere renombre manual (nombre >100 caracteres)* |
| `1bdc917f-fb90-4581-9c1c-5781b5a70fe6` | Meguiars Classic Plast X Crema X 296ml (Restaurador En Gel De Opticas ) | `G12310` | ? | |
| `b4063539-1957-41c6-a508-76cfcada8bef` | Meguiars Gold Class Leather Spray X 473 Ml (Limpiador De Cueros En Spray. Humecta Y Acondiciona El Cuero) | `G10916` | ? | ⚠️ *Requiere renombre manual (nombre >100 caracteres)* |
| `ff79cf13-d822-4961-ace1-6ac7d0e40542` | Meguiars Mirror Glaze Detailing Clay Bar 200g (Arcilla En Barra) | `C2000` | ? | |
| `7ad8df3d-c086-41ef-87da-ddba38852696` | Meguiars Mirror Glaze Hi Tech Yellow Wax 473ml (Cera De Carnauba, Limpia Y Abrillanta) | `M2616` | ? | |
| `b3cca854-070e-45a4-a010-266c1bb0800f` | Meguiars Mirror Glaze Synthetic Sealant 2.0 473ml (Cera Sintetica Con Polimeros. Elimina Marcas Livianas) | `M2116` | ? | ⚠️ *Requiere renombre manual (nombre >100 caracteres)* |
| `5bf04aa7-cdd9-4aa3-812f-7536bff7a783` | Meguiars Mirror Glaze Ultra Finishing Polish 0.945l (Abrillantador Suave . Elimina Defectos Livianos) | `M20532` | ? | ⚠️ *Requiere renombre manual (nombre >100 caracteres)* |
| `2f896b9d-5249-48b0-8a80-78b1d9cdb6a1` | Meguiars Paño De Microfibra 40x40 Cm Ideal Para La Limpieza Y Lustrado De Las Superficies Del Automóvil. | `Z2005` | ? | ⚠️ *Requiere renombre manual (nombre >100 caracteres)* |
| `887dd802-c343-4e6a-bf51-deb5a00a99bc` | Meguiars Ultimate All Wheel Cleaner Limpiador De Llantas Y Frenos | `G18024` | ? | |
| `714e506c-d3ee-4cae-86fa-e2cacae5a202` | Meguiars Ultimate Quick Detailer Spray X 650 Ml (Detallador De Alto Brillo Repele El Agua, Tolera Varios Lavados ) | `G14422` | ? | ⚠️ *Requiere renombre manual (nombre >100 caracteres)* |
| `6511e244-7076-4acf-9f67-60dd9c069d8e` | Menzerna Power Lock Sellador Acrilico 250 Ml | `4260063011412` | ? | |
| `prod-1782596636073-lcv2uuekl` | Mini Creme Wax Banana Toxic Shine Cera Carnauba 120 Ml | `PRD-1782596636073-PKXSH` | ? | |
| `59819dd2-18a1-4bc6-abbb-e336113fd900` | Mini Watermelon Cera En Crema Toxic Shine 120 Ml | `MINI WATERMELON` | ? | |
| `e96c5d33-3484-49b0-8216-ef8ecb5f6f4c` | New Tire Toxic Shine Revitalizador De Cubiertas Y Plasticos Exteriores 600 Ml | `TS3669785NT` | ? | |
| `prod-1778536002530-gzdtki41s` | Ntp Toxic Shine Acondicionador De Plasticos Y Gomas Exterior 250 Ml | `PRD-1778536002530-TCUJW` | ? | |
| `339a6029-6043-4237-a9c3-4afc2329acbb` | Ntp Toxic Shine Acondicionador De Plasticos Y Gomas Exterior 600 Ml | `TS0190200NTP` | ? | |
| `c4d829c6-2057-4f16-b40c-ba9beb3108f8` | Pad Aplicador Con Bolsillo Microfibra Colores Varios | `AJ060` | ? | |
| `dbaab415-da42-4b5a-8351-9c7410027d88` | Pad Aplicador De Poliespuma Amarillo | `PADPOLIES` | ? | |
| `1611096b-3742-46bc-a240-b047e71cfbfd` | Pad De Cordero 3" Blanco | `6973` | ? | |
| `9f26387e-71c4-4f5d-bf45-4914b96debd1` | Paint Prepare Toxic Shine Preparador De Superficies 600 Ml | `TS0110300PP` | ? | |
| `e5d539f3-c602-4fd0-bd6b-4d6be2ec962c` | Paño De Limpieza Chamois 43x32 | `GY-3824` | ? | |
| `c66a47bd-bac3-47b4-bbd2-f5d764c4238f` | Paño De Microfibra Goo Year 30x40 | `GY-2879` | ? | |
| `f7025bc3-7421-42de-a973-3be8148c0332` | Paño Diamante Texturado 60 X 40 Celeste - Violeta | `EL007 EL008` | ? | |
| `f0d5b9ce-5663-4c35-bd11-130f13e176b4` | Paño Microfibra 30 X 30 Cm | `LM-016` | ? | |
| `6e78ba0c-6783-4df6-8904-3f2ca11f82b6` | Paño Microfibra 40 X 40 Cm | `LM-002` | ? | |
| `c5f6d510-0eb3-4173-baac-04adc79b8381` | Paño Microfibra 40 X 40 Toxic Shine | `MICRO 40` | ? | |
| `prod-1782736683821-mq3ikdpw2` | PAÑO MICROFIBRA 40 X 40 TOXIC SHINE | `PRD-1782736683820-B1EA7` | ? | ⚠️ → "PAÑO Microfibra 40 X 40 Toxic Shine" *(ALL CAPS name)* |
| `9629a3c4-ab4b-488e-bcb8-b3b68ae427c5` | Paño Microfibra 80 X 40 Toxic Shine | `MICRO 80` | ? | |
| `4e9a6fa0-2159-40dc-b077-1aef8fc82485` | Paño Microfibra Laffitte 60 X 90 Cm Gris | `AJ53` | ? | |
| `5833fba8-5592-42d8-9f0c-69985d159baa` | Paño Microfibra Laffitte Gris 40x40 | `AJ04` | ? | |
| `4ee5b3ba-aff9-4766-847c-3bd9c269e679` | Paño Microfibra Para Vidrios 30 X 35 | `LM-030` | ? | |
| `294e9263-32c9-4e08-b5eb-14fb5109e102` | Pincel Detallado Auto Care Mango Madera | `1112` | ? | |
| `d374336d-8c6f-4598-b1f6-73dd12fe4021` | Pincel Detallado Laffitte Mango Negro | `1113` | ? | |
| `87eaf0ac-9a6d-4fd8-8a12-d0d0e8d94fee` | Pincel Interior Autocare X Unidad Mango Naranja | `7562` | ? | |
| `187a29cc-b2a4-41b0-8d76-37ad8c938d4d` | Polish Toxic Shine Compuesto De Pulido 600 Ml | `TS0018009PO` | ? | |
| `cd2fc285-3bf0-483b-b0b9-2a51f2528f20` | Reparo Tweteer 304 Blauline 8214 Jh09 5039 | `RPST304` | ? | |
| `523b42e3-6a07-450f-bda3-fbd50cb3cb46` | Revitalidor De Cuero Spray Leather Toxic Shine | `TS36699785NT` | ? | |
| `bc6d9e27-72b9-4322-a1e2-bba7ba261026` | Sellador Hibrido Lava Crush Toxic Shine 600 Ml | `TS037256LC` | ? | |
| `a58f6a4a-68e8-4f3f-85e8-cac894a485c3` | Sellador Hibrido Seal It All Toxic Shine 600 Ml | `TS0569741SIA` | ? | |
| `8f9d165c-0440-4244-bf8c-5602356e4fb6` | Set Pincel Laffitte 6 Piezas | `1114` | ? | |
| `1b7edd5a-be7c-4c24-aa28-c2d6d07fb786` | Set X 4 Pincel Interior Goma Espuma | `7563` | ? | |
| `49ed1f51-82f9-4092-95a1-970c9ca3bfc8` | Shampoo Atomic Toxic Shine Citrico 600 Ml | `TS9114911AS` | ? | |
| `prod-1778534596724-ap8p0zl6w` | Shampoo Banana 600ml | `PRD-1778534596724-TI7U1` | ? | |
| `prod-1778534594998-lq8e2s21q` | Shampoo Banana 600ml | `PRD-1778534594998-1B39G` | ? | |
| `prod-1778534596117-r61ann076` | Shampoo Banana 600ml | `PRD-1778534596116-7CUMF` | ? | |
| `prod-1778534594072-kgycq6cr5` | Shampoo Banana 600ml | `PRD-1778534594072-624LM` | ? | |
| `prod-1778534596840-5k6suac1b` | Shampoo Banana 600ml | `PRD-1778534596840-BWPB4` | ? | |
| `prod-1778534596220-h3htafvih` | Shampoo Banana 600ml | `PRD-1778534596220-QI43W` | ? | |
| `prod-1778534596345-36vp3asmu` | Shampoo Banana 600ml | `PRD-1778534596345-3GGLS` | ? | |
| `6a7392c5-ca34-4013-a528-fe5af4bc778e` | Shampoo Banana Toxic Shine Ph Neutro 600 Ml | `TS0426056BAG` | ? | |
| `488ce96a-cdda-4c46-ad12-4774351ccdca` | Shampoo Dip Club Toxic Shine Ph Neutro Ideal Vinilo 600 Ml | `TS0070600DC` | ? | |
| `7ec57457-8ded-4bf7-bb18-ba5e8a07a5db` | Shampoo Elite Toxic Shine Ph Neutro Con Mix De Ceras 600 Ml | `TS0010010SE` | ? | |
| `66ba28f6-dc2e-4f82-9f60-619ae009963f` | Shampoo Energy Toxic Shine Ph Neutro 600 Ml | `4996612` | ? | |
| `prod-1778535378289-8k6euvk2q` | SHAMPOO HYPER BLACK SILVER DESTINTION TOXIC SHINE 600 ML | `PRD-1778535378289-W3PJZ` | ? | ⚠️ → "Shampoo Hyper Black Silver Destintion Toxic Shine 600 ML" *(ALL CAPS name)* |
| `61f4e72d-cc97-401c-96bc-74b4ae66b498` | Shampoo Ice Toxic Shine Ph Neutro 600 Ml | `69731477` | ? | |
| `prod-1778535558415-3m9tzpndc` | Shampoo Luxury Foam TOXIC SHINE | `PRD-1778535558414-9C3G9` | ? | |
| `c01404a2-8f1a-498e-ab8b-b5451ec638d6` | Shampoo Pure Foam Toxic Shine 600 Ml | `TS0120300PF` | ? | |
| `a4337e85-7e2d-4fb1-88bf-fd11a08fd255` | Shampoo Supreme Toxic Shine Ph Neutro Espuma Espesa 600 Ml | `TS0129134SS` | ? | |
| `05fdf863-8b25-4499-920f-caea154b2dd4` | Shampoo Wax Toxic Shine Ph Neutro Con Carnauba 600 Ml | `TS02206530SW` | ? | |
| `prod-1782143938916-lz6dedh5i` | SHAMPOO WAX TOXIC SHINE PH NEUTRO CON CARNAUBA 600 ML | `PRD-1782143938916-D55OY` | ? | ⚠️ → "Shampoo WAX Toxic Shine PH Neutro CON Carnauba 600 ML" *(ALL CAPS name)* |
| `22f40d7e-3dbe-496d-9788-2c18031c5138` | Silisur Antiempañante En Aerosol (Mr. Quique) | `5220154` | ? | |
| `e56ae34a-23d7-4579-87be-a0c2665b9fe3` | Silisur Limpia Quita Insectos X 1 Lt | `7796399590163` | ? | |
| `7b926222-37a3-4ad0-a333-57585b0afced` | Silisur Paño Microfibra Multiuso 40x38 | `5010107` | ? | |
| `74138f2a-a532-4f37-a7b6-879b1c069f1c` | Silisur Shampoo Espuma Activa Para Hidrolavadoras 600 Cm3 | `5126023` | ? | |
| `ad92e934-37e9-4390-b992-ac279275c1c8` | Sneakers Toxic Shine 600 Ml (Revividor De Interiores ) | `TS4477652SN` | ? | |
| `511621b0-874c-4d85-852f-0c30b45d487a` | T1 Ceramic Toxic Shine Sellador Ceramico 30 Ml | `CERAMIC T1` | ? | |
| `c985a32b-6dce-4a7c-945b-e968d96af4e2` | Ternnova Leather Conditioner Gel Acondicionador De Cueros Hidrofobico | `LEATHER CONDITIONER` | ? | |
| `30574f59-8f7d-4bf6-9e45-d1fc72f84d56` | Ternnova Limpiador Descontaminante Ipa 1 Lt Apc | `IPA` | ? | |
| `a3bb789c-d8d7-417d-8eec-521bbc2aeccc` | Ternnova Original Finish 1lt | `ORIGINALFINISH` | ? | |
| `6b5f8f9a-2efc-46b8-85a0-05bf9519e366` | Ternnova Perfect View 1 Lt | `LASSCLEANER` | ? | |
| `58b7e471-825f-4696-99ce-eaab31cb76fc` | Ternnova Polymer Tech Wax 1 Lt | `POLYMER TECH` | ? | |
| `a95ec8bf-2d41-4205-81dc-745eb8449734` | Ternnova Quick Detailer 1 Lt | `QUICK DETAILER` | ? | |
| `25369121-157b-44eb-8fdb-44816fc2eb26` | Ternnova Super Polymer Sealant 500cm | `SUPERPOLYMER` | ? | |
| `cb8724f2-19b3-4884-ae69-f4bf42c32b47` | Ternnova Surface Cleaner 1 Lt | `SURFACECLEANER` | ? | |
| `prod-1778536731848-ab3a6e306` | TRIM LOOK CANDY TOXIC SHINE ACONDICIONADOR DE PLASTICOS INTERIOR 600 ML | `PRD-1778536731848-SWFF5` | ? | ⚠️ → "Trim Look Candy Toxic Shine Acondicionador DE Plasticos Interior 600 ML" *(ALL CAPS name)* |
| `prod-1778536778814-czk8q4oqu` | UVA SHAKE TOXIC SHINE ACONDICIONADOR DE PLASTICOS Y GOMAS EXTERIOR E INTERIOR DE BASE ACUOSA 600 ML | `PRD-1778536778814-X7A22` | ? | ⚠️ → "UVA Shake Toxic Shine Acondicionador DE Plasticos Y Gomas Exterior E Interior DE Base Acuosa 600 ML" *(ALL CAPS name)* |
| `98ccec4d-b93d-47b4-8eb2-5084c135edbd` | Walker Lava Parabrisa Concentrado 120ml | `5225401` | ? | |
| `9c598b59-755c-48b8-8feb-f4116313bd4d` | Water Spot Toxic Shine Restaurador De Vidrios 600 Ml | `TS33690014WS` | ? | |
| `2d82a966-f759-4b70-81ff-20232c6b44d5` | Waterless Car Wash Drop D Black Label (Limpiador En Seco) | `468248466` | ? | |
| `36274af5-d1c2-4778-8fc2-034df16e86fa` | Waterless Toxic Shine Quick Detailer Limpieza En Seco 600 Ml | `TS0545003WL` | ? | |

| **SQL — Renombrar productos** |
|---|---|
```sql
UPDATE product SET name = 'Alcaline Whells Toxic Shine Limpiador Alcalino 600 ML' WHERE id = 'prod-1778536189968-tbfpfai68';
UPDATE product SET name = 'ALL IN ONE Toxic Shine Restaura Y DA Brillo 600 ML' WHERE id = 'prod-1778536954646-6kqk4d2ec';
UPDATE product SET name = 'Aromatizante UVA Toxic Shine' WHERE id = 'prod-1781181463620-1dw85qjdl';
UPDATE product SET name = 'Aromatizante Vainilla Toxic Shine' WHERE id = 'prod-1783010557713-gtq3tswu0';
UPDATE product SET name = 'Atomizador Boss Toxic Shine 120 ML' WHERE id = 'prod-1783008647620-gwooyje1s';
UPDATE product SET name = 'Atomizador Candy Caramelo DE Banana Toxic Shine 120 M' WHERE id = 'prod-1783008144104-wgpx0kg21';
UPDATE product SET name = 'Atomizador Cherry Toxic Shine 120 ML' WHERE id = 'prod-1783007390762-dxl67wwhy';
UPDATE product SET name = 'Atomizador Invictus Toxic Shine 120 ML' WHERE id = 'prod-1783008084254-g4o2bk4o3';
UPDATE product SET name = 'Atomizador Lady Toxic Shine 120 ML' WHERE id = 'prod-1783007122797-mpnrrexsf';
UPDATE product SET name = 'Atomizador Lemon Mint Fresh Toxic Shine 120 ML' WHERE id = 'prod-1783007924783-01d52n6m2';
UPDATE product SET name = 'Atomizador Mango GO Toxic Shine 120 ML' WHERE id = 'prod-1783008220169-lvg92xhe8';
UPDATE product SET name = 'Atomizador NEW CAR Toxic Shine 120 ML' WHERE id = 'prod-1783007485662-3rh6hn57r';
UPDATE product SET name = 'Atomizador Rocket Power Toxic Shine 120 ML' WHERE id = 'prod-1783009133797-v2r2is0ep';
UPDATE product SET name = 'Atomizador Sneakers Toxic Shine 120 ML' WHERE id = 'prod-1783007760449-ik6ygk6r5';
UPDATE product SET name = 'Atomizador Sweet Fruty Toxic Shine 120 M' WHERE id = 'prod-1783007853902-hp7shikf0';
UPDATE product SET name = 'Atomizador UVA Toxic Shine 120 ML' WHERE id = 'prod-1783007689027-mo990pcr6';
UPDATE product SET name = 'Atomizador Wanawe Toxic Shine 120 ML' WHERE id = 'prod-1783007998350-fu6npr62h';
UPDATE product SET name = 'Back TO Black Toxic Shine 600 ML (Revitalizador DE Superficies Platicas Para Auto)' WHERE id = 'prod-1778537109652-pm8runq9m';
UPDATE product SET name = 'Candy Cream Toxic Shine Acondicionador DE Plasticosy Gomas Exterior A Base Acuosa 600 ML' WHERE id = 'prod-1781101847997-cs0pfgp1i';
UPDATE product SET name = 'Candy Cream Toxic Shine Acondicionador DE Plasticosy Gomas Exterior A Base Acuosa 600 ML' WHERE id = 'prod-1778536676691-cigvxy5co';
UPDATE product SET name = 'Caucho Para Cubierta Dark Fluid Toxic Shine 600 ML' WHERE id = 'prod-1778536053822-oyr0x5slc';
UPDATE product SET name = 'Cera Liquida Lavish Toxic Shine Hybrid WAX 600 ML' WHERE id = 'prod-1778535613601-volvikmj7';
UPDATE product SET name = 'Clean Stuff Toxic Shine 360 GR Aerosol' WHERE id = 'prod-1778537072948-5x08qys54';
UPDATE product SET name = 'Cristal Titanium Toxic Shine 30 ML Vidrio Liquido Sellador Ceramico' WHERE id = 'prod-1778537161428-iq2ze4p7z';
UPDATE product SET name = 'Ctrl-Z Toxic Shine 600ml (Limpiador Multiuso)' WHERE id = 'prod-1778536321891-douwin1v9';
UPDATE product SET name = 'Dark Colors Abrillantador Colores Oscuros 600ml' WHERE id = 'prod-1778536865120-l1twy4jrp';
UPDATE product SET name = 'Fruty Cream Toxic Shine Acondicionador DE Plasticos Interior Y Exterior . Restaura EL Color 600 ML' WHERE id = 'prod-1778536444924-288uazjcs';
UPDATE product SET name = 'Hells Toxic Shine Revitalizador DE Cubiertas Y Plasticos Exteriores 600ml ' WHERE id = 'prod-1778536130731-5bzjs0qab';
UPDATE product SET name = 'Holy Gloss Toxic Shine Acondicionador DE Plasticos Interiores Y Exteriores EN Crema 600 ML' WHERE id = 'prod-1778536490718-59aw8zvxe';
UPDATE product SET name = 'Limpiador Quita Brea X TAR Toxic Shine 600 ML' WHERE id = 'prod-1778535834986-b2uxlqp2g';
UPDATE product SET name = 'Mango GO Toxic Shine (Acondicionador Plasticos Interior)' WHERE id = 'prod-1778536544521-5yq152onk';
UPDATE product SET name = 'Mash Melon Toxic Shine Acondicionador DE Plasticos Y Gomas Exterior E Interior DE Base Acuosa 600 ML' WHERE id = 'prod-1778536588571-pajj13sz9';
UPDATE product SET name = 'PAÑO Microfibra 40 X 40 Toxic Shine' WHERE id = 'prod-1782736683821-mq3ikdpw2';
UPDATE product SET name = 'Shampoo Hyper Black Silver Destintion Toxic Shine 600 ML' WHERE id = 'prod-1778535378289-8k6euvk2q';
UPDATE product SET name = 'Shampoo WAX Toxic Shine PH Neutro CON Carnauba 600 ML' WHERE id = 'prod-1782143938916-lz6dedh5i';
UPDATE product SET name = 'Trim Look Candy Toxic Shine Acondicionador DE Plasticos Interior 600 ML' WHERE id = 'prod-1778536731848-ab3a6e306';
UPDATE product SET name = 'UVA Shake Toxic Shine Acondicionador DE Plasticos Y Gomas Exterior E Interior DE Base Acuosa 600 ML' WHERE id = 'prod-1778536778814-czk8q4oqu';
```
⚠️ *7 producto(s) requieren renombre manual (nombres muy largos >100 caracteres)*

---

### 5. Accesorios Exterior

**SQL — Crear categoría:**
```sql
INSERT INTO category (id, name, description, color, "sortOrder", "isActive")
VALUES ('cat-exterior', 'Accesorios Exterior', 'Antenas, escobillas limpiaparabrisas, colas de escape, estribos, barreros, lonas, aletones, vinilos, barras San Antonio', '#06B6D4', 5, true);
```

**SQL — Asignar productos a esta categoría:**
```sql
UPDATE product SET "categoryId" = 'cat-exterior' WHERE id IN (
  '8f1da39f-51f8-4438-a215-1006a3a69986',
  'f278420e-6e51-462a-b5a9-6caae28d91d6',
  'c96e1e78-49bb-43d7-a3ed-9a42f30349c9',
  '6beeeb2a-d2d5-4632-ac38-58bc895264fd',
  'prod-1782231140684-921jlmc3o',
  'dfdf28ff-6cac-4ac3-a273-2e4537d5a86d',
  '56d0d9b8-581f-4aeb-830f-018d6fcdb7db',
  '422f0b91-c89c-4a0e-87c4-ca7461f8df7b',
  '6f7137f2-b56f-42a6-9075-0cc406afeedf',
  'f90964b6-9098-4c0e-8f60-680c95519acf',
  'ed6dbbe1-869d-453f-ba34-697ea3e0c6a9',
  '2ae4d56c-4950-488e-93a1-564d7edf725b',
  '89ddacec-a252-4cfa-a2a8-e6628f7b9f19',
  '29d50cfd-91a4-4f94-877c-4184e91ec861',
  'eb3855f3-178b-4c77-b3e9-748512b509c7',
  'e4f33d26-7860-4e45-a1dc-b6ebf2c8f46a',
  '27146d65-5915-4412-8d90-0dcb173aba6d',
  'fb71e0ad-736c-48e0-91f2-5b0f66d67636',
  '25f53a67-dd56-4be9-991b-e0abfe42df96',
  'cba78bdc-2a0a-4ce6-a14d-bb5ed85a21f1',
  '11c7aa78-f541-4519-9978-5c52a1d180df',
  'c0a6e4c8-2cf4-4a89-a38c-4220cfa7649c',
  '8aa75f9f-7c4a-448b-a36d-1ef5d0fac30b',
  '332408a9-9d2e-445c-a20d-90a6b077d9da',
  '865bfcc2-f7fc-41b1-a041-14d6c9b40ff0',
  '2dd48710-a4a1-4df8-b2b6-d461cba15281',
  'ece922d9-ccbe-4d3b-baa1-a5b87529d24b',
  'e8f17247-65b5-4f9a-91b5-717c8e142176',
  'e9623baf-6a66-4c30-9831-52575ddeb85b',
  '78c72d9d-049c-40f2-a2e0-172894ec4121',
  '9ba47541-2ee5-4281-bb27-98886c37b3e0',
  '26bcbb70-de93-4d9b-899d-1c0a33bb3247',
  'b7e10c7e-ee38-48dc-8792-410b8b8b9512',
  '09694549-0539-480c-8f37-39281c887324',
  '5f9587eb-efbe-4c0f-b716-e40eecbc3dee',
  'b9ef33df-9b17-400f-be0d-d066141573b8',
  '1cddf378-e184-4218-bd2a-c416dd32400d',
  '12a844c5-038c-464c-ab9a-34eb201fae58',
  '2370bd6f-f5bd-402e-a261-f1d002c72997',
  'a01152fe-d25c-4290-a89b-0484e6b341ef',
  'a7e02b86-dcfe-4a99-a9da-530c63b3e178',
  '8d2e66d9-9b70-472e-b7d3-4098a554ab3e',
  '51108576-1747-4d4c-963d-6e053353b8c4',
  '91032487-cc36-483f-97f7-0841d5c62e78',
  '1c6257d0-a605-40e7-b3a6-fd7a224c3a78',
  'prod-1781798228818-dmt7qf8f1',
  'prod-1781800169380-g11o2cqx6',
  'prod-1781801585118-gc6m2lyqb',
  'prod-1781801649615-72h8azt39',
  'prod-1781801707184-p3l9t5yi8',
  'prod-1781801759611-ybdupe5m9',
  'prod-1781801956321-ovwxe712y',
  '5166e56d-3b38-41c6-bb79-5f2993aed36c',
  '76fedb72-ef1f-4c73-970b-9c6f5d73c708',
  '4614e898-d5d9-4ece-8a15-0421dabe9981',
  'd21f0077-7c6b-4b39-a850-9c242bad56f9',
  '291a9aa7-9f1a-4cf6-8cd0-ed0a314b8dc6',
  '1ecdac8b-5706-464e-b7cc-6cc1e5efc92c',
  'dbd129bb-689b-4dfb-bae6-c1dfb8a03570',
  '44724323-23d3-48d9-9ae7-f50d2bcb5cc3',
  '682a949c-3f72-4a3f-8914-7b44a43bc8dc',
  '3dc98ecc-af36-45db-b6d1-3997832f0783',
  '90976975-82ff-4836-b828-774a8b11f594',
  '64fcf4a0-a71a-4f6a-a7fe-8e3b6468a996',
  '24c45a5e-5764-4b03-81af-34100514f7d6',
  '82f7ace9-ec9d-4965-a1bb-d630a870d979',
  'ea114910-5b88-4649-929f-f9a57446026e',
  'bd686f70-aa3d-4179-9f6d-89eb70863c7e',
  '02d2db34-ca05-4982-b0b2-741fca39e90f',
  '609348c3-82d5-43ea-b11e-d1c3d88d8596',
  'fae030cf-4cfb-4348-9961-cdcf543f0201',
  '0a804faa-4a84-4b14-af63-018d7fb646af',
  'a6db01b6-01e0-461e-bc69-85a13752dab5',
  'c29714d4-44f3-46c1-a702-472d3f7795d8',
  '535a4b94-96f4-47df-9639-209f95b971a5',
  'e4feeacf-b207-461b-949d-a4e6da2b2e9e',
  'a96866e8-67f1-4689-b7a6-b52763e8bfae',
  '1d75854a-3a89-4086-86c7-512320e9076e',
  '819cf71b-3ae8-4130-9d76-97c7075ed114',
  '0881ab92-640d-4164-a0ec-0388c6adece3',
  '068092d6-f764-4895-8883-72febe5329a7',
  'a9b0efcb-85bf-4fe9-bb0e-c72c1708f6b9',
  '215d5762-df83-4bc5-9b29-5ec774dec7ac',
  '333bec4c-26c1-40c1-892f-5781388ce9c9',
  '492f5799-690b-49e8-898c-57433adce68a',
  'd8700886-2946-44a9-8358-61c67a681590',
  '72cd27ca-4251-4509-98f4-b81b1f91e3d0',
  '8be74e7d-9080-43b6-8264-a65d3256d097',
  'a49ee355-0fa4-4eb8-a400-1279a7fcc7a5',
  '69dfdfc1-7726-4549-a1ea-7c662fcac25e',
  'f9dc9613-f7b2-47a0-90b8-f417bca134da',
  'f41173c9-5f44-4180-b16a-76af8c743c4c',
  'fb871854-1ae8-40cb-837c-a3f82d5cc966',
  '86b34b6a-4544-455f-b26a-33a5ec80077a',
  '8ce63cb2-54ad-410b-bcfc-8ad9f2cb77f1',
  '8919a093-0f60-45e3-900f-a92cb8683b08',
  'fb304ed1-9d4e-467d-bb82-3122440513b8',
  '17aa0e4f-98d2-44b8-9b7a-792d5a234885',
  '248f64fd-c023-4489-92fd-5c6a7a9e443b',
  'af47cc9b-aeee-4931-8f32-598ce3e8f079',
  'd8840e57-f0ba-46ec-b3a7-b427632657d0',
  '9d55f643-8ed6-4cf5-aad9-937feb566acd',
  'd21f8ffb-7486-410e-8102-ebbc79c10228',
  '95c1f1b2-b4a5-44ba-9989-cb6cb330cefa',
  '33ba4d77-9d84-4866-b7df-4a38662154c3',
  '6e5ade82-5bc9-463c-95ca-4c6f082ef776',
  '971dec87-4b42-439c-bf21-9a3bf4f4dd14',
  'd72b5743-f3ad-4da1-9637-7d08a5eec507',
  '2ce3eb92-77ac-4844-9ec6-69d704e107be',
  '7dde0d4f-4ead-49ae-9f06-14ff1a280c79',
  'bf763cee-06d2-4064-acf7-d41f919f5794',
  'c632b4c0-0d26-4d30-ae1e-445f7179f6eb',
  '9024f7b0-766f-4c60-9bf1-2ad7a830e714',
  '370f2cc8-0761-4424-a7cb-7d84dbd8bf36',
  '52a15b72-d861-4fde-94f2-7cb2c2cac86f',
  '5489372d-96b8-4a03-ac1d-d09f00cd361c',
  '3209a37d-d4b4-42d7-a3f7-57b6a452f3f9',
  '60e4c04f-9836-4160-a6df-63b0ebc593e0',
  'f84f682a-d441-422c-bcbe-3cf82b8970aa',
  '8d3ab019-3ec9-4768-bc0d-e2382d258fa9',
  '7040639b-c6a6-4f34-a2f8-4f9ccd0e29b6',
  '07d1b11e-2185-413d-b486-f369669a3e3b',
  '7144e9e0-3250-4d4b-abce-b2bba0a51d20',
  'e188c6e3-510e-433c-81d0-06889ad417ca',
  '885b0831-837f-49e0-990e-edfb3ba644e5',
  '0922c56e-8123-45cd-a567-640d4e172ffa',
  '7918c735-3d9c-4808-a9e6-53c389b83410'
);
```

**Productos (127):**

| ID | Nombre actual | SKU | Stock | Sugerencia |
|---|---|---|---|---|
| `8f1da39f-51f8-4438-a215-1006a3a69986` | Adaptador Antena Iso | `CN-02` | ? | |
| `f278420e-6e51-462a-b5a9-6caae28d91d6` | Adaptador De Antena (Fakra) | `ST-AD04` | ? | |
| `c96e1e78-49bb-43d7-a3ed-9a42f30349c9` | Adaptador De Antena Din Corto | `V171` | ? | |
| `6beeeb2a-d2d5-4632-ac38-58bc895264fd` | Adaptador De Antena Espiga P/ Soldar | `V168` | ? | |
| `prod-1782231140684-921jlmc3o` | ALETONES P/LIMPIAPARABRISAS CARFU-NEGRO | `PRD-1782231140684-5AW1C` | ? | ⚠️ → "Aletones P/Limpiaparabrisas Carfu-Negro" *(ALL CAPS name)* |
| `dfdf28ff-6cac-4ac3-a273-2e4537d5a86d` | Antena 4 Tramos Guardabarro | `AA-001` | ? | |
| `56d0d9b8-581f-4aeb-830f-018d6fcdb7db` | Antena De Goma Receptor | `1571 - MA542` | ? | |
| `422f0b91-c89c-4a0e-87c4-ca7461f8df7b` | Antena De Guardabarros Con Angulo | `AC012B6` | ? | |
| `6f7137f2-b56f-42a6-9075-0cc406afeedf` | Antena De Techo Original Corsa / Gol | `AA-015` | ? | |
| `f90964b6-9098-4c0e-8f60-680c95519acf` | Antena Deportiva Aluminio Azul | `AA-018A` | ? | |
| `ed6dbbe1-869d-453f-ba34-697ea3e0c6a9` | Antena Deportiva Tiburon Chica Lyf Negro | `AN008` | ? | |
| `2ae4d56c-4950-488e-93a1-564d7edf725b` | Antena Deportiva Tiburon Mediana Iael Cromada | `AA-029` | ? | |
| `89ddacec-a252-4cfa-a2a8-e6628f7b9f19` | Antena Earth Tiburon Cromada | `YI-188` | ? | |
| `29d50cfd-91a4-4f94-877c-4184e91ec861` | Antena Imitacion Gol Adhesiva. | `AA-012 / 2282I` | ? | |
| `eb3855f3-178b-4c77-b3e9-748512b509c7` | Antena Mastil Cromado | `AA-031` | ? | |
| `e4f33d26-7860-4e45-a1dc-b6ebf2c8f46a` | Antena Mastil Goma Corto Universal | `AA-030` | ? | |
| `27146d65-5915-4412-8d90-0dcb173aba6d` | Antena Mastil Tunning Cromado | `AA-032` | ? | |
| `fb71e0ad-736c-48e0-91f2-5b0f66d67636` | Antena Techo De Aluminio Corta Lyf-rojo | `8065` | ? | |
| `25f53a67-dd56-4be9-991b-e0abfe42df96` | Antena Tipo Original Fiat - Renault - Peugeot | `AA-017` | ? | |
| `cba78bdc-2a0a-4ce6-a14d-bb5ed85a21f1` | Antena Tuning Univ Negro | `AA-018N` | ? | |
| `11c7aa78-f541-4519-9978-5c52a1d180df` | Antena Universal Tunning | `AA-018G` | ? | |
| `c0a6e4c8-2cf4-4a89-a38c-4220cfa7649c` | Antena Universal Tunning Roja | `AA-018R` | ? | |
| `8aa75f9f-7c4a-448b-a36d-1ef5d0fac30b` | Barra Tecno Cromada Ford Ranger +98 Hasta 2012 | `BTLFOC01` | ? | |
| `332408a9-9d2e-445c-a20d-90a6b077d9da` | Barra Tecno Cromada Nissan Frontier +2010 A 2016 | `BTLNIC02` | ? | |
| `865bfcc2-f7fc-41b1-a041-14d6c9b40ff0` | Barra Tecno Cromada Ranger +2012 | `BTLFOC02` | ? | |
| `2dd48710-a4a1-4df8-b2b6-d461cba15281` | Barra Tecno Inoxidable Hilux +16 | `BTLTOI03` | ? | |
| `ece922d9-ccbe-4d3b-baa1-a5b87529d24b` | Barra Tecno Inoxidable Toro | `BTLFII01` | ? | |
| `e8f17247-65b5-4f9a-91b5-717c8e142176` | Barra Tecno Usada Original Cromada Hilux +05 Hasta 2016 | `BTLTOC02` | ? | |
| `e9623baf-6a66-4c30-9831-52575ddeb85b` | Barrero Rigido Universal Delantero Chico Barr26/21 | `BR-100` | ? | |
| `78c72d9d-049c-40f2-a2e0-172894ec4121` | Barrero Rigido Universal Trasero Barr21/32 | `BR-101` | ? | |
| `9ba47541-2ee5-4281-bb27-98886c37b3e0` | Cola De Escape Boca Redonda | `CE-006` | ? | |
| `26bcbb70-de93-4d9b-899d-1c0a33bb3247` | Cola De Escape Borde Quemado | `CES42` | ? | |
| `b7e10c7e-ee38-48dc-8792-410b8b8b9512` | Cola De Escape Combinada Lyf | `3290` | ? | |
| `09694549-0539-480c-8f37-39281c887324` | Cola De Escape Cromada Salida Doble | `1511` | ? | |
| `5f9587eb-efbe-4c0f-b716-e40eecbc3dee` | Cola De Escape Gris | `CES38` | ? | |
| `b9ef33df-9b17-400f-be0d-d066141573b8` | Cola De Escape Negra | `CES35-B` | ? | |
| `1cddf378-e184-4218-bd2a-c416dd32400d` | Cola De Escape Total Tune | `5002` | ? | |
| `12a844c5-038c-464c-ab9a-34eb201fae58` | Cola De Escape Univ. Aluminio Coca Ancha Spider | `CE-009` | ? | |
| `2370bd6f-f5bd-402e-a261-f1d002c72997` | Cola De Escape Universal Cromada Force | `CE-010` | ? | |
| `a01152fe-d25c-4290-a89b-0484e6b341ef` | Cola De Escape Universal Salida Doble Caño Tipo Abarth | `CE-007` | ? | |
| `a7e02b86-dcfe-4a99-a9da-530c63b3e178` | Cubre Auto Suv L Grande Tricapa | `CU-105` | ? | |
| `8d2e66d9-9b70-472e-b7d3-4098a554ab3e` | Cubre Auto Tricapa Airway Talle Xxl | `933` | ? | |
| `51108576-1747-4d4c-963d-6e053353b8c4` | Cubre Auto Tricapa Talle S | `CU-120` | ? | |
| `91032487-cc36-483f-97f7-0841d5c62e78` | Cucharin Cromado Fiesta 2010/2017 (Kinetic) | `JRCUC433` | ? | |
| `1c6257d0-a605-40e7-b3a6-fd7a224c3a78` | Cucharin Cromado Focus 2 2007 -2013 | `JRCUC427` | ? | |
| `prod-1781798228818-dmt7qf8f1` | Escobilla 12" TYC New Dynamic | `66005/12` | ? | |
| `prod-1781800169380-g11o2cqx6` | Escobilla 16" TYC New Dynamic | `66005/16` | ? | |
| `prod-1781801585118-gc6m2lyqb` | Escobilla 19" TYC New Dynamic | `66005/19` | ? | |
| `prod-1781801649615-72h8azt39` | Escobilla 20" TYC New Dynamic | `66005/20` | ? | |
| `prod-1781801707184-p3l9t5yi8` | Escobilla 22" TYC New Dynamic | `66005/22` | ? | |
| `prod-1781801759611-ybdupe5m9` | Escobilla 24" TYC New Dynamic | `66005/24` | ? | |
| `prod-1781801956321-ovwxe712y` | Escobilla 26" TYC New Dynamic | `66005/26` | ? | |
| `5166e56d-3b38-41c6-bb79-5f2993aed36c` | Escobilla Buffalo Universal 13" Chapa | `C13` | ? | |
| `76fedb72-ef1f-4c73-970b-9c6f5d73c708` | Escobilla Buffalo Universal 14" Chapa | `C14` | ? | |
| `4614e898-d5d9-4ece-8a15-0421dabe9981` | Escobilla Buffalo Universal 15" Chapa | `C15` | ? | |
| `d21f0077-7c6b-4b39-a850-9c242bad56f9` | Escobilla Buffalo Universal 17" Chapa | `C17` | ? | |
| `291a9aa7-9f1a-4cf6-8cd0-ed0a314b8dc6` | Escobilla Buffalo Universal 28" Chapa | `C28` | ? | |
| `1ecdac8b-5706-464e-b7cc-6cc1e5efc92c` | Escobilla Dcl 22 | `DCL22` | ? | |
| `dbd129bb-689b-4dfb-bae6-c1dfb8a03570` | Escobilla Dcl 24 | `DCL24` | ? | |
| `44724323-23d3-48d9-9ae7-f50d2bcb5cc3` | Escobilla Ektion Multifuncional Fit 14 | `FIT14` | ? | |
| `682a949c-3f72-4a3f-8914-7b44a43bc8dc` | Escobilla Ektion Multifuncional Fit 15 | `FIT15` | ? | |
| `3dc98ecc-af36-45db-b6d1-3997832f0783` | Escobilla Ektion Multifuncional Fit 16 | `FIT16` | ? | |
| `90976975-82ff-4836-b828-774a8b11f594` | Escobilla Ektion Multifuncional Fit 17 | `FIT17` | ? | |
| `64fcf4a0-a71a-4f6a-a7fe-8e3b6468a996` | Escobilla Ektion Multifuncional Fit 18 | `FIT18` | ? | |
| `24c45a5e-5764-4b03-81af-34100514f7d6` | Escobilla Ektion Multifuncional Fit 19 | `FIT19` | ? | |
| `82f7ace9-ec9d-4965-a1bb-d630a870d979` | Escobilla Ektion Multifuncional Fit 20 | `FIT20` | ? | |
| `ea114910-5b88-4649-929f-f9a57446026e` | Escobilla Ektion Multifuncional Fit 21 | `FIT21` | ? | |
| `bd686f70-aa3d-4179-9f6d-89eb70863c7e` | Escobilla Ektion Multifuncional Fit 22 | `FIT22` | ? | |
| `02d2db34-ca05-4982-b0b2-741fca39e90f` | Escobilla Ektion Multifuncional Fit 24 | `FIT24` | ? | |
| `609348c3-82d5-43ea-b11e-d1c3d88d8596` | Escobilla Ektion Multifuncional Fit 26 | `FIT26` | ? | |
| `fae030cf-4cfb-4348-9961-cdcf543f0201` | Escobilla Ektion Multifuncional Fit 28 | `FIT28` | ? | |
| `0a804faa-4a84-4b14-af63-018d7fb646af` | Escobilla Gutto 26 | `.` | ? | |
| `a6db01b6-01e0-461e-bc69-85a13752dab5` | Escobilla Iael 18 | `LP-118` | ? | |
| `c29714d4-44f3-46c1-a702-472d3f7795d8` | Escobilla Iael 20 | `LP-120` | ? | |
| `535a4b94-96f4-47df-9639-209f95b971a5` | Escobilla Multiencastre Orlan Rober 20 | `ESM-20` | ? | |
| `e4feeacf-b207-461b-949d-a4e6da2b2e9e` | Escobilla Multiencastre Orlan Rober 21 | `ESM-21` | ? | |
| `a96866e8-67f1-4689-b7a6-b52763e8bfae` | Escobilla Qkl 28 " Ultra Blade 8 Adaptadores | `QKL UB28` | ? | |
| `1d75854a-3a89-4086-86c7-512320e9076e` | Escobilla Qkl Ultra Blade 8 Adaptadores | `QKL UB30` | ? | |
| `819cf71b-3ae8-4130-9d76-97c7075ed114` | Escobilla Trico 22" Chapa | `TR 70-220` | ? | |
| `0881ab92-640d-4164-a0ec-0388c6adece3` | Escobilla Trico 24" Chapa | `TR 70-240` | ? | |
| `068092d6-f764-4895-8883-72febe5329a7` | Escobilla Trico Curv 14" C/u | `TR 16-140` | ? | |
| `a9b0efcb-85bf-4fe9-bb0e-c72c1708f6b9` | Escobilla Trico Curv 17" C/u | `TR 16-170` | ? | |
| `215d5762-df83-4bc5-9b29-5ec774dec7ac` | Escobilla Trico Curv 19" C/u | `TR 16-190` | ? | |
| `333bec4c-26c1-40c1-892f-5781388ce9c9` | Escobilla Trico Curv 20" C/u | `TR 16-200` | ? | |
| `492f5799-690b-49e8-898c-57433adce68a` | Escobilla Trico Flex 14 | `TR 17-140` | ? | |
| `d8700886-2946-44a9-8358-61c67a681590` | Escobilla Trico Flex 17 | `TR 17-170` | ? | |
| `72cd27ca-4251-4509-98f4-b81b1f91e3d0` | Escobilla Trico Flex 18 | `TR 17-180` | ? | |
| `8be74e7d-9080-43b6-8264-a65d3256d097` | Escobilla Trico Flex 19 | `TR 17-190` | ? | |
| `a49ee355-0fa4-4eb8-a400-1279a7fcc7a5` | Escobilla Trico Flex 20 | `TR 17-200` | ? | |
| `69dfdfc1-7726-4549-a1ea-7c662fcac25e` | Escobilla Trico Flex 21 | `TR 17-210` | ? | |
| `f9dc9613-f7b2-47a0-90b8-f417bca134da` | Escobilla Trico Flex 28 | `TR 17-280` | ? | |
| `f41173c9-5f44-4180-b16a-76af8c743c4c` | Escobilla Trico Flex 32 | `TR 17-320` | ? | |
| `fb871854-1ae8-40cb-837c-a3f82d5cc966` | Escobilla Trico Juego Original Agile Montana | `TR 80-916` | ? | |
| `86b34b6a-4544-455f-b26a-33a5ec80077a` | Escobilla Trico Juego Original Chevrolet Trail Blazer S10 | `TR 80-917` | ? | |
| `8ce63cb2-54ad-410b-bcfc-8ad9f2cb77f1` | Escobilla Trico Juego Original Ecosport Kinetic 2012 Adelante | `TR 80-710` | ? | |
| `8919a093-0f60-45e3-900f-a92cb8683b08` | Escobilla Trico Juego Original Nissan Note Kicks Fiat 500 | `TR 90-804` | ? | |
| `fb304ed1-9d4e-467d-bb82-3122440513b8` | Escobilla Trico Juego Original Sandero Logan Stepway | `TR 80-921` | ? | |
| `17aa0e4f-98d2-44b8-9b7a-792d5a234885` | Escobilla Trico Juego Original Sw4 Hilux 2015 Ecosport Kinetic 2018adelante | `TR 90-106` | ? | |
| `248f64fd-c023-4489-92fd-5c6a7a9e443b` | Escobilla Trico O Bosch Trasera Rear 11 | `H840` | ? | |
| `af47cc9b-aeee-4931-8f32-598ce3e8f079` | Escobilla Trico Trasera Rear 10 | `TR 19-100` | ? | |
| `d8840e57-f0ba-46ec-b3a7-b427632657d0` | Escobilla Trico Trasera Rear 11 | `TR 19-110` | ? | |
| `9d55f643-8ed6-4cf5-aad9-937feb566acd` | Escobilla Trico Trasera Rear 12 | `TR 70-12A` | ? | |
| `d21f8ffb-7486-410e-8102-ebbc79c10228` | Escobilla Trico Trasera Rear 12 | `TR 70-12B` | ? | |
| `95c1f1b2-b4a5-44ba-9989-cb6cb330cefa` | Escobilla Trico Trasera Rear 12 | `TR 70-12P` | ? | |
| `33ba4d77-9d84-4866-b7df-4a38662154c3` | Escobilla Trico Trasera Rear 13 | `TR 19-130` | ? | |
| `6e5ade82-5bc9-463c-95ca-4c6f082ef776` | Escobilla Trico Trasera Rear 14 | `TR 19-140` | ? | |
| `971dec87-4b42-439c-bf21-9a3bf4f4dd14` | Escobilla Trico Trasera Rear 14 | `TR 70-14T` | ? | |
| `d72b5743-f3ad-4da1-9637-7d08a5eec507` | Escobilla Trico Trasera Rear 15 | `TR 19-150` | ? | |
| `2ce3eb92-77ac-4844-9ec6-69d704e107be` | Escobilla Trico Trasera Rear 16 | `TR 19-160` | ? | |
| `7dde0d4f-4ead-49ae-9f06-14ff1a280c79` | Escobilla Trico Trasera Rear 16 | `TR 70-16T` | ? | |
| `bf763cee-06d2-4064-acf7-d41f919f5794` | Estribo Universal 2.00 Mts Aluminio | `EUNA03` | ? | |
| `c632b4c0-0d26-4d30-ae1e-445f7179f6eb` | Estribo Universal 2.00 Mts Aluminio Negro | `EUNAN03` | ? | |
| `9024f7b0-766f-4c60-9bf1-2ad7a830e714` | Estribo Universal 2.00 Mts Aluminio Sin Anodizar | `EUNAS03` | ? | |
| `370f2cc8-0761-4424-a7cb-7d84dbd8bf36` | Estribo Universal Impactus Aluminio Grisdc | `EIM000` | ? | |
| `52a15b72-d861-4fde-94f2-7cb2c2cac86f` | Lona C/estructura S10 <11 Cd Sin Jaula | `240` | ? | |
| `5489372d-96b8-4a03-ac1d-d09f00cd361c` | Lona C/estructura Toyota Hilux Dc 05 /16 | `31214` | ? | |
| `3209a37d-d4b4-42d7-a3f7-57b6a452f3f9` | Mastil Antena Goma Larga Universal | `AA-034` | ? | |
| `60e4c04f-9836-4160-a6df-63b0ebc593e0` | Ntena Imitacion Cola Tiburon Gris | `AA-026` | ? | |
| `f84f682a-d441-422c-bcbe-3cf82b8970aa` | Proyector Blanco G5c | `6405` | ? | |
| `8d3ab019-3ec9-4768-bc0d-e2382d258fa9` | Proyector G1 Circular | `6401` | ? | |
| `7040639b-c6a6-4f34-a2f8-4f9ccd0e29b6` | Proyector G1c Cuadrado | `6403` | ? | |
| `07d1b11e-2185-413d-b486-f369669a3e3b` | Proyector G5 | `6404` | ? | |
| `7144e9e0-3250-4d4b-abce-b2bba0a51d20` | Soporte De Estribo Amarok | `EAVW01` | ? | |
| `e188c6e3-510e-433c-81d0-06889ad417ca` | Soporte De Estribo Ecosport - 2013 | `EAFO02` | ? | |
| `885b0831-837f-49e0-990e-edfb3ba644e5` | Soporte De Estribo Frontier Np300 Renault Alaskan | `EANI03` | ? | |
| `0922c56e-8123-45cd-a567-640d4e172ffa` | Soporte De Estribo Hilux +05 | `EATO02` | ? | |
| `7918c735-3d9c-4808-a9e6-53c389b83410` | Soporte De Estribo Ranger +12 | `EAFO03` | ? | |

| **SQL — Renombrar productos** |
|---|---|
```sql
UPDATE product SET name = 'Aletones P/Limpiaparabrisas Carfu-Negro' WHERE id = 'prod-1782231140684-921jlmc3o';
```

---

### 6. Iluminación Auxiliar

**SQL — Crear categoría:**
```sql
INSERT INTO category (id, name, description, color, "sortOrder", "isActive")
VALUES ('cat-iluminacion-aux', 'Iluminación Auxiliar', 'Faros auxiliares, neblineros, apliques cromados para faros', '#F97316', 6, true);
```

**SQL — Asignar productos a esta categoría:**
```sql
UPDATE product SET "categoryId" = 'cat-iluminacion-aux' WHERE id IN (
  'e7618e31-e794-462c-874a-e9adfe742ab9',
  '2799b536-c67a-4d5f-9422-c9914be11153',
  'bfc11566-adc5-4a08-b2a3-9aea4f0df56b',
  'd12b90d1-cc2d-40be-8215-23b653a9ee51',
  '9a68dcbc-6e6a-48c1-9b2e-0fd6cc611949',
  '10d8ae3a-be88-43e0-a10f-ca3a218e46c4',
  '98c20a2e-c1d2-4423-ad52-fc45ff3707dc',
  '17c77523-5f46-423b-8d74-024c03c9281e',
  '8ad6c377-fdbb-4de9-8f6b-2ab01fc3c9d2',
  '86ab6af4-891c-4134-a0ba-77d0066b3b7e',
  '8de89473-6e91-45a3-9b4b-f6abcfdd141e',
  '70baf1f1-108c-443b-99ff-08de4e7c6687',
  '113c8574-be15-4fbb-86d8-0dcf08533760',
  '1412c598-5a92-4f54-b091-9b506710445d',
  'c4f47e3c-e079-4478-a6ef-242836ccd428',
  '5d727048-ae5a-4c1b-bcf3-f47bbbe2939d',
  '7ee94a9c-ba9f-42df-86e3-cd90465232f3',
  '06cf4835-51fb-4e0e-81c4-ff369cdf6cda',
  '8078bf2d-8179-47eb-9dfb-6d68e57f5159',
  '964fcd08-3d48-4e26-8eae-4114c5cee0b7',
  '24937a04-8420-4b89-8086-0e94983d47b8',
  'fbd18749-553b-461d-874e-6caf89a342bb',
  '6113129d-eede-428e-aa22-8ba0108579d0',
  'dc3dab65-b102-414d-98e0-85c6bbe2b822',
  '4cdb5337-2d60-4958-98fe-fd5472067952',
  'e44a4890-f894-4e50-a3d9-f3ab8a87ed82',
  '28ed8c99-dc7c-45a3-ab27-d563791d9372',
  '3f4e7fc0-084d-4871-974a-ab0e894cc4ce',
  '606af318-10b4-4c76-a4b1-645bc775ec44',
  '2572f371-5d56-44ca-9aec-24716525d121',
  '203c12a9-1492-4d7c-907d-938e839fa0c7',
  'f015c492-c03e-40cf-978c-c7cc0e57d0db',
  'b95e52b9-4658-4ca0-8477-1005fb72dc8d',
  '54e3078a-112c-41ed-8063-16174f25f7de',
  '36eab261-6fa4-4f32-bd0b-7dee90578221',
  '599ea4b4-18c2-4e14-b21a-8b9f6b8ae71c',
  'a8f114df-dd5c-41b6-a672-c360d2161279',
  '5aa4d99b-5770-4a97-a263-ca46d4a3ec5d',
  '6b2377c7-0ea0-4460-aee9-abf8ae62b25a',
  '196e9031-09bb-4a03-877a-21a347e9d173',
  'a26db38c-0d7e-4cda-b54d-db4dc207868f',
  '2d22ee35-59b9-43e1-8534-714ffdb5d112',
  '70e6d0b6-0cc5-4cd8-96db-69e3f95bdf94',
  'fae696d1-d7dc-459f-a676-d49c6a38456b',
  '36f2a739-ea0a-4227-9905-c0271bc1213c',
  'f25a66e1-48e8-49f1-908a-b3218ec8ffcb',
  '2ba6ff15-19ea-410a-b905-ae948d5c1d41',
  'ffb710e9-ce7d-4cab-a915-f5fadad8b52b',
  '36c3e709-7e38-47f9-a71a-9539ae8eeb85',
  'd80f92ae-c0f9-412e-af3b-9667e66e4faf',
  '5389c8ca-fe0e-4d7a-91b7-35aa96913247',
  'da767676-3a23-4306-820e-3fc943a1f7c3',
  'a2904008-4426-4706-8214-7e925dd80dde',
  'c83b10ae-3d91-4973-96f0-0085f7c4d0d8',
  '9ab26946-a0c0-4159-8231-2b185d66bb74',
  '7003ec03-d03d-46d9-a29c-ecb2fbc69a46',
  'c3098f65-c5ce-44c4-8e54-16440b80e168',
  'f50e8bd8-1b9d-4d56-86a3-54581e7a5984',
  'b5c032d3-a7d7-434a-9e67-383e75fb2832',
  '401e9c70-1386-42a7-a1fe-a6e6f49e69f4',
  'a56a1933-560b-4250-b872-499e1b52964d',
  '154f3a3f-ce66-4dd0-8b39-2f49955246a5',
  '9309b009-a618-4b48-b3bf-bdf44d0e8be4',
  '23fe4d33-e551-4d98-980b-eb47d3667fe1',
  'b6fb7220-b5d2-4f7a-bd09-8f15ec7982a9',
  '0e228c30-e77f-4927-9ff8-78c0667f97fe',
  'e9e1100f-9306-4ea7-92e5-8e2e6f0bd3ee',
  '41d99c79-e74b-484a-be9f-3fdaad7c365a',
  'e2c35986-a793-4b7a-a46c-5fce12eef0aa',
  'ea283c41-369e-43aa-9534-61053d90b95f',
  '04a7b156-14ee-41de-beba-6a2b51e87cc9',
  '730c1d55-70e1-4126-9c65-7fed0179baa9',
  'e38e33e7-8d81-49f8-acda-4f93ec8920de',
  'de6ec1fb-0bac-4f0d-8050-f162263b97c9',
  'e7082098-1406-419d-9a57-0e04e2ea076a',
  'd6e0a3cc-882d-473f-b811-4936286f561f',
  'fa2bbd04-3433-4ba7-ad19-e73135cb495a',
  '2eb11cbc-b188-478c-917c-c51d4d573ac9',
  '78f04118-1469-4c0a-a478-d9774dd86278',
  '1817e2b0-6792-41c0-8108-2fa1e3bb055a',
  '87d49aa6-cd33-469b-ba0f-70a24fa85faf',
  'e08b3960-9a51-42d1-b3ca-d9eec5296da4',
  '510e5e6e-e538-4f55-864d-2f111c139e68',
  '667db8d4-878c-419d-b789-38dca7355d22',
  '95b533dd-d950-496a-81f1-94a688b7854c',
  '3c9610ba-7e97-46a4-a28a-621f272277d4',
  '320a9166-e302-48a0-9ff7-b9d7a417e95f',
  '29a4c34f-84ec-41f4-9d0f-e6e6e5179d41',
  'eac94553-e46a-49f0-9f3e-50994f8f4bfb',
  'ea2c45f0-f503-490d-87ca-e6fae6bd1242',
  '64b736e1-9d2b-4770-bba3-123b196e0f0e',
  '9b31d305-b8c0-4d05-b177-7d431be9ca13',
  '74d849b1-cfb4-4ff6-8cdc-ee109726e093'
);
```

**Productos (93):**

| ID | Nombre actual | SKU | Stock | Sugerencia |
|---|---|---|---|---|
| `e7618e31-e794-462c-874a-e9adfe742ab9` | Aplique Cromado Faro Aux Ranger 2012/2015 | `FC-FO-2162` | ? | |
| `2799b536-c67a-4d5f-9422-c9914be11153` | Aplique Cromado Faro Auxiliar Fiesta 2008/2010. | `FC-FO-2117` | ? | |
| `bfc11566-adc5-4a08-b2a3-9aea4f0df56b` | Aplique Cromado Faro Auxiliar Ka 08/11 | `FC-FO-2116` | ? | |
| `d12b90d1-cc2d-40be-8215-23b653a9ee51` | Aplique Cromado Faro Auxiliar Onix / Prisma 2013/... | `FC-CH-6434` | ? | |
| `9a68dcbc-6e6a-48c1-9b2e-0fd6cc611949` | Aplique Cromado Faro Auxiliar S10 2012/2016 | `FC-CH-6424` | ? | |
| `10d8ae3a-be88-43e0-a10f-ca3a218e46c4` | Aplique Cromado Faro Auxiliar Toyota Hilux 2005/2015 | `FC-TO-7478` | ? | |
| `98c20a2e-c1d2-4423-ad52-fc45ff3707dc` | Aplique Cromado Faros Auxiliares Peugeot 206 X2 | `JRFAR732` | ? | |
| `17c77523-5f46-423b-8d74-024c03c9281e` | Aplique Cromado Faros Traseros Gol Giii 00/05 | `JRFAR713` | ? | |
| `8ad6c377-fdbb-4de9-8f6b-2ab01fc3c9d2` | Barra 24 Led 108w 33cm | `HTO2324` | ? | |
| `86ab6af4-891c-4134-a0ba-77d0066b3b7e` | Barra De Led Curva 60 Cm 120 W | `CURV120` | ? | |
| `8de89473-6e91-45a3-9b4b-f6abcfdd141e` | Barra De Led Recta 60 Cm 120w ( Bar120 ) | `BAR120` | ? | |
| `70baf1f1-108c-443b-99ff-08de4e7c6687` | Faro Auxiliar 206 99/04 Pata Corta | `4258/I` | ? | |
| `113c8574-be15-4fbb-86d8-0dcf08533760` | Faro Auxiliar 3008 10/17 C3 Picasso 11/13 5008 12/17 C4 Picasso 14/16 307 06/12 C4 Lounge 14/18 C3 Aircross 13/15 208 13/16 207 08/15 | `12530/5` | ? | ⚠️ *Requiere renombre manual (nombre >100 caracteres)* |
| `1412c598-5a92-4f54-b091-9b506710445d` | Faro Auxiliar Agile Onix Sonic Cobalt Spin 13/16 Derecho | `11544/D` | ? | |
| `c4f47e3c-e079-4478-a6ef-242836ccd428` | Faro Auxiliar Agile Onix Sonic Cobalt Spin 13/16 Izquierdo | `11544/3I` | ? | |
| `5d727048-ae5a-4c1b-bcf3-f47bbbe2939d` | Faro Auxiliar Astra 03/11 Izquierdo | `11507/I` | ? | |
| `7ee94a9c-ba9f-42df-86e3-cd90465232f3` | Faro Auxiliar Audi A3 02/04 Derecho | `32103/D` | ? | |
| `06cf4835-51fb-4e0e-81c4-ff369cdf6cda` | Faro Auxiliar Audi A3 02/04 Izquierdo | `32103/I` | ? | |
| `8078bf2d-8179-47eb-9dfb-6d68e57f5159` | Faro Auxiliar Aveo 11/15 Derecho | `11543/D` | ? | |
| `964fcd08-3d48-4e26-8eae-4114c5cee0b7` | Faro Auxiliar Aveo 11/15 Izquierdo | `11543/I` | ? | |
| `24937a04-8420-4b89-8086-0e94983d47b8` | Faro Auxiliar Chevrolet Classic 10/16 Derecho | `4242/3D` | ? | |
| `fbd18749-553b-461d-874e-6caf89a342bb` | Faro Auxiliar Corsa Classic 99/11 | `4248/2D` | ? | |
| `6113129d-eede-428e-aa22-8ba0108579d0` | Faro Auxiliar Corsa Ii 02/11 Meriva 03/13 Derecho | `11502/2D` | ? | |
| `dc3dab65-b102-414d-98e0-85c6bbe2b822` | Faro Auxiliar Ecosport 03/07 | `11903/5` | ? | |
| `4cdb5337-2d60-4958-98fe-fd5472067952` | Faro Auxiliar Ecosport 07/13 Derecho | `11919/5D` | ? | |
| `e44a4890-f894-4e50-a3d9-f3ab8a87ed82` | Faro Auxiliar Fiat Punto 07/12 Derecho | `4417/5D` | ? | |
| `28ed8c99-dc7c-45a3-ab27-d563791d9372` | Faro Auxiliar Fiat Punto 07/12 Izquierdo | `4417/5I` | ? | |
| `3f4e7fc0-084d-4871-974a-ab0e894cc4ce` | Faro Auxiliar Fiat Uno 88/04 | `3970` | ? | |
| `606af318-10b4-4c76-a4b1-645bc775ec44` | Faro Auxiliar Ford Focus 15/18 Derecho | `32129/5D` | ? | |
| `2572f371-5d56-44ca-9aec-24716525d121` | Faro Auxiliar Ford Focus 15/18 Izquierdo | `32129/5I` | ? | |
| `203c12a9-1492-4d7c-907d-938e839fa0c7` | Faro Auxiliar Ford Focus Ii 04/10 Derecho | `11906/5D` | ? | |
| `f015c492-c03e-40cf-978c-c7cc0e57d0db` | Faro Auxiliar Ford Focus Ii 04/10 Izquierdo | `11906/5I` | ? | |
| `b95e52b9-4658-4ca0-8477-1005fb72dc8d` | Faro Auxiliar Fox Suran10/15 Saveiro 10/13 Trend 08/12 Golf 07/11 Derecho | `12340/5D` | ? | |
| `54e3078a-112c-41ed-8063-16174f25f7de` | Faro Auxiliar Fox Suran10/15 Saveiro 10/13 Trend 08/12 Golf 07/11 Izquierdo | `12340/5I` | ? | |
| `36eab261-6fa4-4f32-bd0b-7dee90578221` | Faro Auxiliar Gol Y Senda 91/95 / Gacel 88/95 / Saveiro 91/97 Derecho | `801/AD` | ? | |
| `599ea4b4-18c2-4e14-b21a-8b9f6b8ae71c` | Faro Auxiliar Hilux 08/11 Ixquierdo | `896I` | ? | |
| `a8f114df-dd5c-41b6-a672-c360d2161279` | Faro Auxiliar Laguna 95/98 Renault 19 93/00 | `4305/BI` | ? | |
| `5aa4d99b-5770-4a97-a263-ca46d4a3ec5d` | Faro Auxiliar Laguna 99/02 / Kangoo 08/12 / Scenic 01/10 / Megane 99/02 Izquierdo | `4325/2I` | ? | |
| `6b2377c7-0ea0-4460-aee9-abf8ae62b25a` | Faro Auxiliar Nissan Tiida 08/15 | `32265/2` | ? | |
| `196e9031-09bb-4a03-877a-21a347e9d173` | Faro Auxiliar Peugeot 408 10/15 Derecho | `12536/D` | ? | |
| `a26db38c-0d7e-4cda-b54d-db4dc207868f` | Faro Auxiliar Peugeot 408 10/15 Izquierdo | `12536/I` | ? | |
| `2d22ee35-59b9-43e1-8534-714ffdb5d112` | Faro Auxiliar Seat Ibiza Cordoba 00/03 Derecho | `4378/D` | ? | |
| `70e6d0b6-0cc5-4cd8-96db-69e3f95bdf94` | Faro Auxiliar Seat Ibiza Cordoba 00/03 Izquierdo | `4378/I` | ? | |
| `fae696d1-d7dc-459f-a676-d49c6a38456b` | Faro Auxiliar Surancross 12/14 Crossfox 10/15 Derecho | `12367/10D` | ? | |
| `36f2a739-ea0a-4227-9905-c0271bc1213c` | Faro Auxiliar Surancross 12/14 Crossfox 10/15 Izquierdo | `12367/10I` | ? | |
| `f25a66e1-48e8-49f1-908a-b3218ec8ffcb` | Faro Auxiliar Sw4 16/21 Corolla 14/17 Hilux 16/21 Rav 16/19 Derecho | `32295/D` | ? | |
| `2ba6ff15-19ea-410a-b905-ae948d5c1d41` | Faro Auxiliar Universal Citroen Peugeot Renault Ford | `12521` | ? | |
| `ffb710e9-ce7d-4cab-a915-f5fadad8b52b` | Faro Auxiliar Vectra 06/10 Agile 09/13 Derecho (809) | `11531/D` | ? | |
| `36c3e709-7e38-47f9-a71a-9539ae8eeb85` | Faro Auxiliar Vectra 06/10 Agile 09/13 Derecho (809) | `11531/2D` | ? | |
| `d80f92ae-c0f9-412e-af3b-9667e66e4faf` | Faro Auxiliar Vectra 06/10 Agile 09/13 Izquierdo (809) | `11531/2I` | ? | |
| `5389c8ca-fe0e-4d7a-91b7-35aa96913247` | Faro Auxiliar Vw Gol G4 06/14 Derecho | `12303/D` | ? | |
| `da767676-3a23-4306-820e-3fc943a1f7c3` | Faro Auxiliar Vw Gol G4 06/14 Izquierdo | `12303/2I` | ? | |
| `a2904008-4426-4706-8214-7e925dd80dde` | Faro Auxiliar Vw Gol G4 06/14 Izquierdo | `12303/I` | ? | |
| `c83b10ae-3d91-4973-96f0-0085f7c4d0d8` | Faro Auxiliar Vw Voyage Gol Trend 12/16 Derecho | `12351/D` | ? | |
| `9ab26946-a0c0-4159-8231-2b185d66bb74` | Faro Auxiliar Vw Voyage Gol Trend 12/16 Izquierdo | `12351/I` | ? | |
| `7003ec03-d03d-46d9-a29c-ecb2fbc69a46` | Faro Auxiliares Mobi 16/24 Fiorino 14/22 Cronos 18/23 Argo 17/24 | `12540` | ? | |
| `c3098f65-c5ce-44c4-8e54-16440b80e168` | Faro Delantero Fiat Ducato Boxer Jumper 95/04 Derecho | `4400/D` | ? | |
| `f50e8bd8-1b9d-4d56-86a3-54581e7a5984` | Faro Delantero Fiat Ducato Boxer Jumper 95/04 Izquierdo | `4400/I` | ? | |
| `b5c032d3-a7d7-434a-9e67-383e75fb2832` | Faro Trasero Ford Focus Mk3-i 13/15 5 Pta Derecho | `11937/5D` | ? | |
| `401e9c70-1386-42a7-a1fe-a6e6f49e69f4` | Faro Trasero Toyota Corolla 08/11 | `32165/D` | ? | |
| `a56a1933-560b-4250-b872-499e1b52964d` | Jgo. Aro De Faro Giro Linea Vw (Bora- Golf- Amarok- Otros) | `DB-193` | ? | |
| `154f3a3f-ce66-4dd0-8b39-2f49955246a5` | Jgo. Aro De Faro Giro Polo/caddy/saveiro/golf | `AE40` | ? | |
| `9309b009-a618-4b48-b3bf-bdf44d0e8be4` | Juego Faro Auxiliares Fiat Punto 07/12 | `4417/10` | ? | |
| `23fe4d33-e551-4d98-980b-eb47d3667fe1` | Kit Faro Auxiliar Corsa Ii 02/11 Meriva 03/13 | `11502/10` | ? | |
| `b6fb7220-b5d2-4f7a-bd09-8f15ec7982a9` | Kit Faro Auxiliar Ford Ecosport 12/17 | `12521/26` | ? | |
| `0e228c30-e77f-4927-9ff8-78c0667f97fe` | Kit Faro Auxiliar Ford Ecosport 12/17 Con Aro Cromado | `12521/27` | ? | |
| `e9e1100f-9306-4ea7-92e5-8e2e6f0bd3ee` | Kit Faro Auxiliar Ford Ecosport Ii (07/13) | `11919/20` | ? | |
| `41d99c79-e74b-484a-be9f-3fdaad7c365a` | Kit Faro Auxiliar Ford Focus Mk2 08/13 (3600) | `12521/19` | ? | |
| `e2c35986-a793-4b7a-a46c-5fce12eef0aa` | Kit Faro Auxiliar Gol G7 16/19 | `12385/15` | ? | |
| `ea283c41-369e-43aa-9534-61053d90b95f` | Kit Faro Auxiliar Kangoo 13/18 | `12521/24` | ? | |
| `04a7b156-14ee-41de-beba-6a2b51e87cc9` | Kit Faro Auxiliar S-10 08/11 Blazer 01/10 | `4260/10` | ? | |
| `730c1d55-70e1-4126-9c65-7fed0179baa9` | Kit Faro Auxiliar Vw Gol Saveiro 99/05 | `4363/12` | ? | |
| `e38e33e7-8d81-49f8-acda-4f93ec8920de` | Kit Faro Auxiliar Vw Polo 00/04 | `4368/10` | ? | |
| `de6ec1fb-0bac-4f0d-8050-f162263b97c9` | Kit Faro Auxiliares Celta 11/15 Prisma 11/13 Fun 06/11 | `12895/12` | ? | |
| `e7082098-1406-419d-9a57-0e04e2ea076a` | Kit Faro Auxiliares Duster 11/14 | `12521/18` | ? | |
| `d6e0a3cc-882d-473f-b811-4936286f561f` | Kit Faro Auxiliares Fiorino 14/22 Uno Novo 10/16 | `4421/13` | ? | |
| `fa2bbd04-3433-4ba7-ad19-e73135cb495a` | Kit Faro Auxiliares Fiorino 14/22 Uno Novo 10/16 | `4421/12` | ? | |
| `2eb11cbc-b188-478c-917c-c51d4d573ac9` | Kit Faro Auxiliares Hilux 05/08 | `12889` | ? | |
| `78f04118-1469-4c0a-a478-d9774dd86278` | Kit Faro Auxiliares Hilux 08/11 | `12779/10` | ? | |
| `1817e2b0-6792-41c0-8108-2fa1e3bb055a` | Kit Faro Auxiliares Hilux 16/19 | `32295/10` | ? | |
| `87d49aa6-cd33-469b-ba0f-70a24fa85faf` | Kit Faro Auxiliares Megane Ii 05/10 | `12521/15` | ? | |
| `e08b3960-9a51-42d1-b3ca-d9eec5296da4` | Kit Faro Auxiliares Palio 12/18 | `11745` | ? | |
| `510e5e6e-e538-4f55-864d-2f111c139e68` | Kit Faro Auxiliares Palio Y Siena 01/07 | `4420/10` | ? | |
| `667db8d4-878c-419d-b789-38dca7355d22` | Kit Faro Auxiliares Peugeot 207 08/16 | `12521/17` | ? | |
| `95b533dd-d950-496a-81f1-94a688b7854c` | Kit Faro Auxiliares Symbol 09/11 | `12521/14` | ? | |
| `3c9610ba-7e97-46a4-a28a-621f272277d4` | Kit Faros Auxiliares Vw Fox 16/19 | `12385/10` | ? | |
| `320a9166-e302-48a0-9ff7-b9d7a417e95f` | Marco Faro Auxiliar Cromado Fiesta Kinetic X 2 | `JRFAR760` | ? | |
| `29a4c34f-84ec-41f4-9d0f-e6e6e5179d41` | Marco Faro Trasero Cromado Fiesta Kinetic Sin Baul X2 | `JRFAR761` | ? | |
| `eac94553-e46a-49f0-9f3e-50994f8f4bfb` | Soporte Para Faros Arriba Capot Juego Cromado | `KU-BRA003` | ? | |
| `ea2c45f0-f503-490d-87ca-e6fae6bd1242` | Soporte Para Faros Arriba Capot Juego Negro | `KU-BRA004` | ? | |
| `64b736e1-9d2b-4770-bba3-123b196e0f0e` | Soporte Para Faros O Barras Y Motos Juego | `KU-BRA001` | ? | |
| `9b31d305-b8c0-4d05-b177-7d431be9ca13` | Strobo Ajk Rgb (2 Faro) 3w Sin Controlador | `9087` | ? | |
| `74d849b1-cfb4-4ff6-8cdc-ee109726e093` | Tecla Doble Faro Auxiliar Fox Y Suran 06/10 | `9614/10` | ? | |

| **SQL — Renombrar productos** |
|---|---|
⚠️ *1 producto(s) requieren renombre manual (nombres muy largos >100 caracteres)*

---

### 7. Seguridad

**SQL — Crear categoría:**
```sql
INSERT INTO category (id, name, description, color, "sortOrder", "isActive")
VALUES ('cat-seguridad', 'Seguridad', 'Alarmas, antirrobos de rueda, sirenas, bocinas, bulbos de puerta, carcasas de control', '#EF4444', 7, true);
```

**SQL — Asignar productos a esta categoría:**
```sql
UPDATE product SET "categoryId" = 'cat-seguridad' WHERE id IN (
  '22ff26b8-38a1-4c7c-a48c-aaa0bafc5c4a',
  '419d4336-d09c-4f93-a2c8-4458c814961f',
  '02f5d46e-d751-4c7d-b841-0042037a2980',
  '75562800-1d4c-46e5-928a-b8320c567163',
  '222e4774-489b-4c05-b59e-6980f223f924',
  '4a8880ad-0c66-4bf6-bbd3-9bc22023c70b',
  '0aec8c57-97d0-42bc-8647-5971a7431701',
  '2fbf1550-abd2-4176-bd2b-7c0d86958c0a',
  '470a2c9e-f02d-4505-bd08-184782315377',
  '4bbf7c5b-2ae7-448e-8682-c9f655fd9eec',
  'a711cb9c-0ea9-43de-8e87-fafef313ca65',
  'e7760ad8-34ee-4950-8f06-aa02e735a036',
  '9d38c568-bfee-48e4-ae53-72b0a1b92b72',
  '14fe49e4-b3a2-40c8-92d6-a07b33303484',
  '9a787009-ad15-4854-a6cf-9157eaf4c5e3',
  '5b6c6dd1-7230-4e05-a4f3-f4fc44e75d6d',
  '12104dab-32d4-4992-9e0b-d6077dd4c7d3',
  '5a4a331f-436a-437d-8bb8-ada25d780133',
  'ab04e9b7-7864-406f-a534-50cd6e402ad9',
  '74213727-dbcc-470b-a2e0-29a313d97bce',
  '10e74522-41d2-4f78-be00-f3f0c47c6d02',
  '7451bb11-6764-4f2e-abf9-f20ef32c4428',
  '9d994b05-71bd-4eb2-8bdf-db147c299427',
  'e7088ac9-0237-4f54-9d4f-5de5c02b6397',
  '09571f29-962f-486f-9edb-a7a73fc786bf',
  'c69ce61c-0079-48da-9e11-6ee74e3f2146',
  '9a646ff8-21d9-4b21-9240-fd6133bb0ea0',
  'dfaea7a3-e3e6-4977-b103-5888f7a49555',
  '6b209162-151c-4cd7-b50d-46ea70345539',
  'e1564c92-88ea-43fb-9792-fe8a74118909',
  '5b885c20-99d8-4d2a-a940-d6118370af3b',
  '7ea51d5e-dc70-4f63-9c28-524bfb0576d4',
  '2d2901cf-c9d5-425e-8f2d-3fa2ef782beb',
  'e4185aea-fbb5-4630-a4be-8d7943d77f00',
  '5654dd57-5411-48fe-90b0-b0dcd3d0cf44',
  '19c21429-3e98-4db3-a1de-83549b7e5ff9',
  '4fd5fab9-40f0-4647-b730-df64a0853f83',
  '1d2818f9-6536-451f-8af6-a0c32b8b2ce9'
);
```

**Productos (38):**

| ID | Nombre actual | SKU | Stock | Sugerencia |
|---|---|---|---|---|
| `22ff26b8-38a1-4c7c-a48c-aaa0bafc5c4a` | Alarma Moto X-28 Linea M10 (1 Control) Presencia | `M10` | ? | |
| `419d4336-d09c-4f93-a2c8-4458c814961f` | Alarma Para Auto X-28 Linea Kl20rs Keyless | `KL20RS` | ? | |
| `02f5d46e-d751-4c7d-b841-0042037a2980` | Alarma Para Auto X-28 Linea Kl20s Keyless | `KL20S` | ? | |
| `75562800-1d4c-46e5-928a-b8320c567163` | Alarma Para Auto X-28 Linea Z10 (2 Controles) | `Z10` | ? | |
| `222e4774-489b-4c05-b59e-6980f223f924` | Alarma Para Autos X-28 Linea Z30 | `Z30` | ? | |
| `4a8880ad-0c66-4bf6-bbd3-9bc22023c70b` | Alarma Para Moto Pst Positron Fx 350 ( 2 Controles ) | `FX 350` | ? | |
| `0aec8c57-97d0-42bc-8647-5971a7431701` | Alarma Para Moto X28 M20 | `M20` | ? | |
| `2fbf1550-abd2-4176-bd2b-7c0d86958c0a` | Alarma Positron Para Auto Pst Cyber Ex360 Volumetrica (2 Control) | `EX360` | ? | |
| `470a2c9e-f02d-4505-bd08-184782315377` | Antirrobo Rueda (C10/silverado)dodge Chrysler Ford(ka/ranger)rastrojero Torino Volvo Vw(1500/1800)saab | `RR-001` | ? | ⚠️ *Requiere renombre manual (nombre >100 caracteres)* |
| `4bbf7c5b-2ae7-448e-8682-c9f655fd9eec` | Antirrobo Rueda /Astra Agile Corsa Meriva Vectra,ecosport 4x4 ,Escort,fun,logan Sandero,symbol,fun,clio,bora, Fox, Vento, Voyage, Suran, Gol, Golf, | `RR-006` | ? | ⚠️ *Requiere renombre manual (nombre >100 caracteres)* |
| `a711cb9c-0ea9-43de-8e87-fafef313ca65` | Antirrobo Rueda 4 Bulones Con Dos Adaptadores /Mercedes Benz / Sprinter /Amarok | `RR-010` | ? | |
| `e7760ad8-34ee-4950-8f06-aa02e735a036` | Antirrobo Rueda 4 Bulones Con Dos Adaptadores Ford Renault Vw Audi Peugeot Mercedes Benz | `RR-009` | ? | |
| `9d38c568-bfee-48e4-ae53-72b0a1b92b72` | Antirrobo Rueda 4 Bulones Con Dos Adaptadores Peugeot Citroen | `RR-011` | ? | |
| `14fe49e4-b3a2-40c8-92d6-a07b33303484` | Antirrobo Rueda Ecosport 2007/20, Blazer, Aveo, Captiva, Luv, S10, Courier, Fiesta, Focus, Ka, Mondeo, Accord, City, Civic, Crv, Crx, Fit, Hrv, Pointe | `RR-003` | ? | ⚠️ *Requiere renombre manual (nombre >100 caracteres)* |
| `9a787009-ad15-4854-a6cf-9157eaf4c5e3` | Antirrobo Rueda Fiat(adventure/idea/linea/punto/stilo/strada) | `RR-008` | ? | |
| `5b6c6dd1-7230-4e05-a4f3-f4fc44e75d6d` | Antirrobo Rueda Hilux/4 Honda(city/civic/crv/crx/fit/hrv) Ford(courier/ka/mondeo/escort/ecosport/fiesta/focus/transit 14") Vw(pointer) Che(aveo/vectr | `RR-002` | ? | ⚠️ *Requiere renombre manual (nombre >100 caracteres)* |
| `12104dab-32d4-4992-9e0b-d6077dd4c7d3` | Antirrobo Rueda Korando Vitara Peuget 504 505 Swift Vitara Jimmy Tiida Frontier R 12 | `RR-004` | ? | |
| `5a4a331f-436a-437d-8bb8-ada25d780133` | Antirrobo Rueda Palio Siena Alfa Romeo Sud 33 145 146 155 164 166 | `RR-007` | ? | |
| `ab04e9b7-7864-406f-a534-50cd6e402ad9` | Antirrobo Rueda Peugeot Alfa Romeo Citroen Fiat Seat Lancia Volvo Lada Peugeot 205,206,306,307,309,405,406, | `RR-005` | ? | ⚠️ *Requiere renombre manual (nombre >100 caracteres)* |
| `74213727-dbcc-470b-a2e0-29a313d97bce` | Antirrobo Rueda Toyota Hilux Corolla Rav4 Sprinter Etios Sw4 Yaris Tiggo ( Hasta 2016) Peugeot 4008 | `RR-012` | ? | |
| `10e74522-41d2-4f78-be00-f3f0c47c6d02` | Bocina Caracol 12v | `BS-018` | ? | |
| `7451bb11-6764-4f2e-abf9-f20ef32c4428` | Bocina Galleta 2 Tonos 12v | `BS-015` | ? | |
| `9d994b05-71bd-4eb2-8bdf-db147c299427` | Bulbo Puerta O Capot Regulable Tipo L | `1106` | ? | |
| `e7088ac9-0237-4f54-9d4f-5de5c02b6397` | Bulbo Puerta O Capot Regulable Tipo Tornillo Fino | `1105` | ? | |
| `09571f29-962f-486f-9edb-a7a73fc786bf` | Bulbo Puerta O Capot Regulable Tipo Tornillo Grueso | `1104` | ? | |
| `c69ce61c-0079-48da-9e11-6ee74e3f2146` | Bulbo Pulsador Porton Corredizo Lateral | `501` | ? | |
| `9a646ff8-21d9-4b21-9240-fd6133bb0ea0` | Carcasa Control Pst Key Blancos Modelos Viejos | `ST-CARC4` | ? | |
| `dfaea7a3-e3e6-4977-b103-5888f7a49555` | Carcasa Control Pst Px32 Px33 | `ST-CARC2` | ? | |
| `6b209162-151c-4cd7-b50d-46ea70345539` | Carcasa Control Pst Px42 Px44 | `ST-CARC1` | ? | |
| `e1564c92-88ea-43fb-9792-fe8a74118909` | Carcasa Control Pst Pxn52 Dpn52 | `ST-CARC5` | ? | |
| `5b885c20-99d8-4d2a-a940-d6118370af3b` | Control Remoto Pst Pxn72 | `PXN72` | ? | |
| `7ea51d5e-dc70-4f63-9c28-524bfb0576d4` | Cubre Valvula Con Antirrobo Alemania X4 | `6523` | ? | |
| `2d2901cf-c9d5-425e-8f2d-3fa2ef782beb` | Cubre Valvula Con Antirrobo Francia X4 | `6536` | ? | |
| `e4185aea-fbb5-4630-a4be-8d7943d77f00` | Cubre Valvula Con Antirrobo Italia X4 | `6521` | ? | |
| `5654dd57-5411-48fe-90b0-b0dcd3d0cf44` | Cubre Valvulas Jordan X 4 Con Antirrobo | `6541` | ? | |
| `19c21429-3e98-4db3-a1de-83549b7e5ff9` | Set De Faros Destellantes Strobos X 4 Control Remoto Sin Instalar | `DJ-KD108810W` | ? | |
| `4fd5fab9-40f0-4647-b730-df64a0853f83` | Sirena Chicharra Retromarcha | `BS-008` | ? | |
| `1d2818f9-6536-451f-8af6-a0c32b8b2ce9` | Sirena S21 Para Alarma X-28 (Auto Y Moto) | `S21` | ? | |

| **SQL — Renombrar productos** |
|---|---|
⚠️ *5 producto(s) requieren renombre manual (nombres muy largos >100 caracteres)*

---

### 8. Enganches y Carga

**SQL — Crear categoría:**
```sql
INSERT INTO category (id, name, description, color, "sortOrder", "isActive")
VALUES ('cat-enganches', 'Enganches y Carga', 'Enganches, bochas de remolque, portatablas, barras de techo, caños elípticos, cintas de amarre y remolque', '#6366F1', 8, true);
```

**SQL — Asignar productos a esta categoría:**
```sql
UPDATE product SET "categoryId" = 'cat-enganches' WHERE id IN (
  '42d23f16-aeb7-47d3-9f7d-24b540bbeddb',
  '7154fbb5-cb73-496b-a059-8e9cea85cd7c',
  '805b83c0-95aa-442a-a892-610f03d9f712',
  '5491d54e-04e2-4227-90e0-3bd17a23ae2f',
  '464e6529-e282-4ab4-9523-9e05a900afc1',
  '817b6e6d-7d13-4ac0-ba81-c4a9ea2f4e89',
  '427ae006-ccc3-4c54-b87c-4554ab2c3b86',
  '6f1ff44f-8ef5-436b-9bb5-ba4a69f8d7ee',
  'd5a89771-225d-403c-9279-3f4f5714d39b',
  '421bea83-837f-4812-8854-3fcd7b0d7b61',
  '9c59ef21-5a0f-4c5f-9bcf-21cecd42e174',
  'a1eb5d95-b28d-49b9-98fd-a41367f0f01c',
  '9336dd8d-cb3a-47a6-96be-2082aab6a5e8',
  '012cd829-b68c-444a-90a6-aa7a3ca3bd67',
  '89201aa5-1894-4e6e-ace7-b101b65d2a37',
  'edde221a-935e-41ba-acc9-324dc295fe5f',
  'ee9732c1-44a0-401d-8f0c-33075a3e2c35',
  '4f09db6f-ea09-4a88-a168-e05a968cce65',
  '5e0dad17-a5e7-470d-8572-e8f1db6c6cd6',
  '84cb6989-eb92-4a4b-ad78-686341153785',
  'a960f0f3-3a08-4cee-800f-153f44338d35',
  'd171dd16-4b29-4d32-af7a-8d71c256b56b',
  'ad343a6e-392d-4959-ae3b-72752cff14fc',
  '12ea65e3-46b5-4fe9-82f0-0f043cb0fde9',
  '8f414871-0263-4171-bf22-5d2eff16a576',
  '5ca4ff72-4e65-40ee-b2aa-679f3429c8d8',
  'cfff545d-49f2-462e-a776-d50ec9f06fe6',
  'd23fe150-6d76-483d-a07d-793ac856c117',
  'c9467f38-4ce9-41a7-b8e4-cb6117e87882',
  '59bb7ee7-3bc7-4ec8-8da6-70f0383803f7',
  '8a250822-968d-4223-9e2d-c4c9527d12ae',
  '8fc6449a-48fa-47f1-9552-df22ce5a1a39',
  '62e6e20b-0619-4a14-9ce2-0d2b451c42b1',
  'b252d45b-f9d6-45de-9f6e-ca373d3c832f',
  '29920d01-850d-44b7-b9d5-105f0fb2cf71',
  '6b7a0caa-7f58-4b8c-be68-ddf9d83f0967',
  '8be29f36-0278-4599-8c0e-60010f09f42d',
  '9bb5d317-4cc8-46fa-916a-87ffe73d3112',
  '512bd4de-0d8d-4f02-967a-7e434461f602',
  '4f842b36-f3a9-49ea-abfa-b9630d23a04b',
  'cac7ae5d-c429-424e-b691-7e502d2332f0',
  'c1ed7b0d-5590-43af-86ba-6cba63b7253b',
  '7524f352-f7a5-4d18-a981-4c7592bb29e2',
  '0cd4b955-5096-43f1-b43a-3a2f0525c4f5',
  '4f61bfb9-b7b3-4796-b979-40d9c11e24ca',
  '24395fe6-b587-48ed-bef7-e5fd4035b07e',
  '17076536-4f13-40e0-8155-6d04d23739e8',
  '3cca33b3-dbab-4400-be4b-cb88f0ca55da',
  '533fb887-1d5c-487c-982c-aba2e8097c88',
  'e523151f-13c2-403e-80e5-b5e133eac295',
  '8120b2ae-0e10-4298-ada3-3e5be0fa8fd3',
  '0fa55002-e2ff-4940-9e89-ddbeed04acbc',
  '2ce15a36-0799-4666-b44a-113cd04bd329',
  '48e4c7b2-89b9-4b40-a49c-9c618c3fe92f',
  '19b26c11-2cc9-4185-b78a-9804ac02b410',
  '3bfa52a7-a1e8-457e-8f0e-4b587ae7ada8',
  '99fb7b93-3060-409a-9571-abe73931ef39',
  '0679484a-f9d0-4c10-b72d-0a5140e00dd1',
  '65f9c98d-7616-4050-991a-586c54a3c93d',
  'f47a2dd3-d0c8-4c11-9fa1-38fcbd9d2843',
  '1905254f-9676-40b3-8dd4-37a6b377c307',
  '379e1867-2f9a-455c-a9bc-e5c3b4a08204',
  'a3ccc8b2-a324-44ba-bc84-87815b67ba9e',
  '76227872-4bab-49e6-ab45-3eb1839ddadf',
  '2c5560b1-26d4-4924-b51f-38741288c243',
  '8c592332-fcbd-462a-a60e-3e18764f15ec',
  '811e55af-d107-407f-aee6-1702871e7223',
  'b7c0a2b8-aaed-4eb8-ae58-9c3b68d91289',
  '49d7693e-5df1-4d15-8f81-cc09a98f919d',
  'dac3095a-b094-4c2f-88da-5dd50dbf8421',
  'e7ddbfe3-1db4-41f3-9d25-160ac9974c6f',
  'b4653301-c850-46dd-a0f9-2b7d6edf7e6e',
  'e6833fb9-d441-4ad0-956c-5ded13840bf2',
  '0d106c5a-82e4-4525-bb94-5171ab8da10f',
  'e4c07a29-68ac-4635-b296-4fab104183c8',
  'c4401891-a284-4d44-8baf-2ca079d37a03',
  '0c52cf04-b6af-4aa7-bf1c-94ddcfb8425f',
  '0388479f-e9e4-4d57-ae08-572747ebb67b',
  '021f2796-3f10-4899-99a0-2303bd4488f6',
  '336a8a58-1aaa-4750-a79d-5adab109161a',
  '293ab3ee-0ef8-41ee-b663-6092da0d4bc4',
  '3f7e0c1a-9bae-4f6e-82a2-b15d9b21c434',
  '2e3bbb1e-c8ca-4eae-b829-55e73b94bd2a',
  '85ea9e76-0962-4285-a3a7-7cdaccde3805',
  '0f5f3340-3fa8-4c33-bb2c-340d937067b6',
  '6684f56c-45dc-4315-aedc-38b84215aa0a',
  '1b3dc778-37e2-4760-9490-4aa3ff02c8ff',
  'bd644473-be76-4437-9f54-41fb6f8a6f74',
  '1426429e-0687-4816-88fb-2ba76ced38b6',
  '4bd5cddd-3a95-42da-aa07-1beb0a9b73aa',
  '8b7cfc82-ce23-4f3d-9409-e272032e9304',
  'fd7ecc1f-cbfa-4778-84d2-b4f08ff5e616',
  '3df01985-e28e-4220-87b9-6f3646466807',
  'd1646052-d690-4d7f-a060-2c7355bc597d',
  'b5c3935f-82e3-413c-b3e1-29b5e371e8c8',
  'beeb2679-15d5-4b07-ab15-2fb0404d431a',
  '0210f204-05be-406c-b91f-fffd5d83095a',
  '30c43195-3f59-4470-9e4d-26186a9b4da8',
  '14753122-1de3-494b-aa78-3ece815ca9b3',
  '61432c65-b81b-4ac5-b7db-6693429fd695',
  'd1395933-48bd-46ca-b5b6-8efba247bf40',
  'dc0e0341-2a6a-4fff-b5c3-8c4f0c484259',
  '8f11280a-8e1c-41ce-8df9-24af00840d93',
  'cc5c0e2c-3b92-4246-99b2-21c4fd95df0a',
  'fcdd183f-26ac-461d-8e0e-c1155ef5052f',
  '01ac5f64-2dab-4c53-b7b8-ce5cb1e69abc',
  '1ee73986-ee31-4846-97e6-2bde41a5aa68',
  '9a97c7c8-fc71-48b6-bcd4-4a51ac1a8ddc',
  '897c781e-9f1f-4555-b48d-72116d2a7a5b',
  '73790669-d159-4087-b484-9085417a8c74',
  '9f9c4fe8-0972-472d-954d-d4363717e3bc',
  'e807c464-51f4-48c2-ad2a-28c95f284ae4',
  'ce295a40-c0d8-4520-82bd-37870d51b2c0',
  'eb41baf7-dfe5-4a75-a181-d4ac28b3505a',
  '496f8879-0ad4-4e2d-b1d0-8fceff2a2641',
  '0f9e86d9-f094-4e59-b143-3093ad45bce6',
  'a689b6e4-c88e-4e15-a46f-8c2aa5b4d3d4',
  'cffd8dac-33c6-4862-b320-55826cbfd13b',
  'ca688d56-f42d-4fb8-b134-78d4d4c2db07',
  '3eda0e22-b0cc-4663-97e5-ae25f361e3f5',
  '70dfea8f-f467-4dc5-834d-8893a57ea554',
  '33ce45ea-460d-437e-9529-cb121b25d134',
  '05a01098-ecbc-430e-94ad-509fadfeacdb',
  'e5732138-26d0-4064-801b-9ec2d776cb9f',
  'c07ab205-1406-4785-ade5-f4f840d3ad38'
);
```

**Productos (125):**

| ID | Nombre actual | SKU | Stock | Sugerencia |
|---|---|---|---|---|
| `42d23f16-aeb7-47d3-9f7d-24b540bbeddb` | Bocha Con Gatillo-azul | `PE-033` | ? | |
| `7154fbb5-cb73-496b-a059-8e9cea85cd7c` | Bocha Con Gatillo-cromado | `PE-032` | ? | |
| `805b83c0-95aa-442a-a892-610f03d9f712` | Bocha De Remolque Crom. 1 7/8x3/4 | `TR-001` | ? | |
| `5491d54e-04e2-4227-90e0-3bd17a23ae2f` | Bocha P/palanca De Cambio Redonda Combinada Cuerina Crom Aluminio C/cu¥as Adapt Gatillo | `PE-057` | ? | |
| `464e6529-e282-4ab4-9523-9e05a900afc1` | Caño Elíptico P/barras Aerodynamic Negro 1m (C - B) | `534 C - B` | ? | |
| `817b6e6d-7d13-4ac0-ba81-c4a9ea2f4e89` | Caño Elíptico P/barras Aerodynamic Plata 0.90m (Cp-a) | `537 CP-A` | ? | |
| `427ae006-ccc3-4c54-b87c-4554ab2c3b86` | Caño Elíptico P/barras Aerodynamic Plata 1m (Cp-b) | `538 CP-B` | ? | |
| `6f1ff44f-8ef5-436b-9bb5-ba4a69f8d7ee` | Cinta De Amarre Con Criquet 1" X 5 Mts Reforzada 455kg | `LI-011` | ? | |
| `d5a89771-225d-403c-9279-3f4f5714d39b` | Cinta De Amarre Con Criquet 2" (Reforzada) | `LI-009` | ? | |
| `421bea83-837f-4812-8854-3fcd7b0d7b61` | Cinta De Amarre Con Criquet 2" X 27" Camion | `LI-002` | ? | |
| `9c59ef21-5a0f-4c5f-9bcf-21cecd42e174` | Cinta De Amarre Criquet Kit 4 X 1" X 5 Mts | `LI-014` | ? | |
| `a1eb5d95-b28d-49b9-98fd-a41367f0f01c` | Cinta De Amarre Kit X 2 Criquet 1" X 5 Mts | `GY-2221` | ? | |
| `9336dd8d-cb3a-47a6-96be-2082aab6a5e8` | Cinta De Remolque Plana 2" 4 Mts | `LI-007` | ? | |
| `012cd829-b68c-444a-90a6-aa7a3ca3bd67` | Cuarta Para Remolque Reglamentaria | `SG-009` | ? | |
| `89201aa5-1894-4e6e-ace7-b101b65d2a37` | Cubre Enganche Fox Rojo , Azul , Amarillo | `5432` | ? | |
| `edde221a-935e-41ba-acc9-324dc295fe5f` | Enganche 147 - Spazio | `EFI001` | ? | |
| `ee9732c1-44a0-401d-8f0c-33075a3e2c35` | Enganche 207 Tricuerpo (M) | `EPE043` | ? | |
| `4f09db6f-ea09-4a88-a168-e05a968cce65` | Enganche 307 Tricuerpo (M) | `EPE039` | ? | |
| `5e0dad17-a5e7-470d-8572-e8f1db6c6cd6` | Enganche 308 | `EPE055` | ? | |
| `84cb6989-eb92-4a4b-ad78-686341153785` | Enganche Astra 1 Y 2 Bic Y 1 Tric (M) | `EGM021` | ? | |
| `a960f0f3-3a08-4cee-800f-153f44338d35` | Enganche Aveo -2011 (M) | `EGM047` | ? | |
| `d171dd16-4b29-4d32-af7a-8d71c256b56b` | Enganche Aveo G3 (M) | `EGM077` | ? | |
| `ad343a6e-392d-4959-ae3b-72752cff14fc` | Enganche Bora +07 (M) | `EVW045` | ? | |
| `12ea65e3-46b5-4fe9-82f0-0f043cb0fde9` | Enganche Citroen C3 | `EIM216` | ? | |
| `8f414871-0263-4171-bf22-5d2eff16a576` | Enganche Citroen C4 Tricuerpo (M) | `EIM218` | ? | |
| `5ca4ff72-4e65-40ee-b2aa-679f3429c8d8` | Enganche Corolla Sedan Brasil 04-07 Y +1 | `ETO019` | ? | |
| `cfff545d-49f2-462e-a776-d50ec9f06fe6` | Enganche Corsa Bicuerpo Serie 2 (M) Y Celta | `EGM027` | ? | |
| `d23fe150-6d76-483d-a07d-793ac856c117` | Enganche Corsa Tricuerpo Serie 2 (M) | `EGM029` | ? | |
| `c9467f38-4ce9-41a7-b8e4-cb6117e87882` | Enganche Courier Pick Up | `EFO031` | ? | |
| `59bb7ee7-3bc7-4ec8-8da6-70f0383803f7` | Enganche Crossfox (M) | `EVW047` | ? | |
| `8a250822-968d-4223-9e2d-c4c9527d12ae` | Enganche Cruze Bicuerpo (M) | `EGM059` | ? | |
| `8fc6449a-48fa-47f1-9552-df22ce5a1a39` | Enganche Dodge Journey Incluye Porta Perno Y Perno, O Porta Bocha | `EIM270` | ? | |
| `62e6e20b-0619-4a14-9ce2-0d2b451c42b1` | Enganche Duna | `EFI007` | ? | |
| `b252d45b-f9d6-45de-9f6e-ca373d3c832f` | Enganche Ecosport (B) 2012 | `EFO057` | ? | |
| `29920d01-850d-44b7-b9d5-105f0fb2cf71` | Enganche Ecosport +2017 Motor 2.0 Y 1.5 Incluye Porta Perno Y Perno, O Porta Bocha | `EFO087` | ? | |
| `6b7a0caa-7f58-4b8c-be68-ddf9d83f0967` | Enganche Ecosport 1.6 +2013 Incluye Porta Perno Y Perno, O Porta Bocha | `EFO075` | ? | |
| `8be29f36-0278-4599-8c0e-60010f09f42d` | Enganche Etios Bicuerpo Incluye Porta Perno Y Perno, O Porta Bocha | `ETO033` | ? | |
| `9bb5d317-4cc8-46fa-916a-87ffe73d3112` | Enganche Etios Tricuerpo Incluye Porta Perno Y Perno, O Porta Bocha | `ETO035` | ? | |
| `512bd4de-0d8d-4f02-967a-7e434461f602` | Enganche Fiat Toro Incluye Porta Perno Y Perno, O Porta Bocha | `EFI075` | ? | |
| `4f842b36-f3a9-49ea-abfa-b9630d23a04b` | Enganche Fiesta Max (M) | `EFO059` | ? | |
| `cac7ae5d-c429-424e-b691-7e502d2332f0` | Enganche Fiorino Furgon (M) | `EFI025` | ? | |
| `c1ed7b0d-5590-43af-86ba-6cba63b7253b` | Enganche Focus S1 Bicuerpo (M) | `EFO037` | ? | |
| `7524f352-f7a5-4d18-a981-4c7592bb29e2` | Enganche Focus S1 Tricuerpo (M) | `EFO039` | ? | |
| `0cd4b955-5096-43f1-b43a-3a2f0525c4f5` | Enganche Fox (M) | `EVW035` | ? | |
| `4f61bfb9-b7b3-4796-b979-40d9c11e24ca` | Enganche Gol Cuntry (M) | `EVW031` | ? | |
| `24395fe6-b587-48ed-bef7-e5fd4035b07e` | Enganche Gol Gli +00 Serie 3 (M) | `EVW025` | ? | |
| `17076536-4f13-40e0-8155-6d04d23739e8` | Enganche Gran Siena Incluye Porta Perno Y Perno, O Porta Bocha | `EFI065` | ? | |
| `3cca33b3-dbab-4400-be4b-cb88f0ca55da` | Enganche Hilux +2016 Incluye Porta Perno Y Perno, O Porta Bocha | `ETO037` | ? | |
| `533fb887-1d5c-487c-982c-aba2e8097c88` | Enganche Hilux 4x4 - 4x2 +05 Paragolpe Crom Incluye Porta Perno Y Perno, O Porta Bocha | `ETO009` | ? | |
| `e523151f-13c2-403e-80e5-b5e133eac295` | Enganche Honda Fit +09 Incluye Porta Perno Y Perno, O Porta Bocha | `EIM253` | ? | |
| `8120b2ae-0e10-4298-ada3-3e5be0fa8fd3` | Enganche Ka Serie 2 + 08(m) | `EFO063` | ? | |
| `0fa55002-e2ff-4940-9e89-ddbeed04acbc` | Enganche Kangoo -2018 (B) | `ERE033` | ? | |
| `2ce15a36-0799-4666-b44a-113cd04bd329` | Enganche Kuga (B) | `EFO069` | ? | |
| `48e4c7b2-89b9-4b40-a49c-9c618c3fe92f` | Enganche Logan (M) | `ERE057` | ? | |
| `19b26c11-2cc9-4185-b78a-9804ac02b410` | Enganche Meriva | `EGM031` | ? | |
| `3bfa52a7-a1e8-457e-8f0e-4b587ae7ada8` | Enganche Montana (B) | `EGM053` | ? | |
| `99fb7b93-3060-409a-9571-abe73931ef39` | Enganche Nissan Frontier -09 (B) | `EIM056` | ? | |
| `0679484a-f9d0-4c10-b72d-0a5140e00dd1` | Enganche Palio (M) -2013 | `EFI019` | ? | |
| `65f9c98d-7616-4050-991a-586c54a3c93d` | Enganche Palio Weekend Adventure | `EFI051` | ? | |
| `f47a2dd3-d0c8-4c11-9fa1-38fcbd9d2843` | Enganche Passat +07 | `EVW043` | ? | |
| `1905254f-9676-40b3-8dd4-37a6b377c307` | Enganche Qubo (B) | `EFI061` | ? | |
| `379e1867-2f9a-455c-a9bc-e5c3b4a08204` | Enganche R19 Rt (M) | `ERE011` | ? | |
| `a3ccc8b2-a324-44ba-bc84-87815b67ba9e` | Enganche Ranger +98 Xl Y Xls (B) | `EFO016` | ? | |
| `76227872-4bab-49e6-ab45-3eb1839ddadf` | Enganche Ranger Elegant +02 Paragolpe Cromado(b) | `EFO052` | ? | |
| `2c5560b1-26d4-4924-b51f-38741288c243` | Enganche Renault R9 | `ERE007` | ? | |
| `8c592332-fcbd-462a-a60e-3e18764f15ec` | Enganche Siena -06 (M) | `EFI021` | ? | |
| `811e55af-d107-407f-aee6-1702871e7223` | Enganche Siena 06 - 10 (M) | `EFI035` | ? | |
| `b7c0a2b8-aaed-4eb8-ae58-9c3b68d91289` | Enganche Spark | `EGM043` | ? | |
| `49d7693e-5df1-4d15-8f81-cc09a98f919d` | Enganche Suzuki Gran Vitara (B) | `EIM032` | ? | |
| `dac3095a-b094-4c2f-88da-5dd50dbf8421` | Enganche Symbol (M) | `ERE061` | ? | |
| `e7ddbfe3-1db4-41f3-9d25-160ac9974c6f` | Enganche Toptruck F100 Duty +99 Incluye Porta Perno Y Perno, O Porta Bocha | `ETFO003` | ? | |
| `b4653301-c850-46dd-a0f9-2b7d6edf7e6e` | Enganche Toyota Corolla +2018 Incluye Porta Perno Y Perno, O Porta Bocha | `ETO039` | ? | |
| `e6833fb9-d441-4ad0-956c-5ded13840bf2` | Enganche Tracker (B) | `EGM065` | ? | |
| `0d106c5a-82e4-4525-bb94-5171ab8da10f` | Enganche Voyage | `EVW051` | ? | |
| `e4c07a29-68ac-4635-b296-4fab104183c8` | Enganche Vw Polo Bicuerpo +2017 Incluye Porta Perno Y Perno, O Porta Bocha | `EVW067` | ? | |
| `c4401891-a284-4d44-8baf-2ca079d37a03` | Perno Para Enganche Diametro 19 | `AE03` | ? | |
| `0c52cf04-b6af-4aa7-bf1c-94ddcfb8425f` | Portatabla 1.5 Mt Doble Apoyo Para Techo Plano Ca¥o Eliptico Negro | `9200 L` | ? | |
| `0388479f-e9e4-4d57-ae08-572747ebb67b` | Portatabla De Aluminio Tipo Rural Con Llave 45 | `CP688-45` | ? | |
| `021f2796-3f10-4899-99a0-2303bd4488f6` | Portatabla Eliptico 206 3p , 207 3p , | `KIT 34` | ? | |
| `336a8a58-1aaa-4750-a79d-5adab109161a` | Portatabla Eliptico 406 97-05 , Logan 14-24 , Sandero 12-24 / Peugeot 406 / | `KIT 38` | ? | |
| `293ab3ee-0ef8-41ee-b663-6092da0d4bc4` | Portatabla Eliptico C3 13-16 / Mondeo 96-00 | `KIT 42` | ? | |
| `3f7e0c1a-9bae-4f6e-82a2-b15d9b21c434` | Portatabla Eliptico Chevrolet Spin | `AE 6950N` | ? | |
| `2e3bbb1e-c8ca-4eae-b829-55e73b94bd2a` | Portatabla Eliptico Clio 2 3p 00-12 , Clio 3p 90-98 | `KIT 23` | ? | |
| `85ea9e76-0962-4285-a3a7-7cdaccde3805` | Portatabla Eliptico Corsa 97-08 , Astra 06-11 , Zafira Sin Baranda 01-11 | `KIT 60` | ? | |
| `0f5f3340-3fa8-4c33-bb2c-340d937067b6` | Portatabla Eliptico Duna,uno 5p 98/01 , 408 10/20 , | `KIT 10` | ? | |
| `6684f56c-45dc-4315-aedc-38b84215aa0a` | Portatabla Eliptico Fluence 4 Pts - Megane 10/14 | `KIT 26` | ? | |
| `1b3dc778-37e2-4760-9490-4aa3ff02c8ff` | Portatabla Eliptico Ford Ka 2008-2011 | `KIT 80` | ? | |
| `bd644473-be76-4437-9f54-41fb6f8a6f74` | Portatabla Eliptico Ford Ranger 2013 Doble Cab. | `AE-4800` | ? | |
| `1426429e-0687-4816-88fb-2ba76ced38b6` | Portatabla Eliptico Fox 3 P 04-21 Caño C | `KIT 55` | ? | |
| `4bd5cddd-3a95-42da-aa07-1beb0a9b73aa` | Portatabla Eliptico Golf 4 5p - Bora 05-14 - Vectra 93-05 - Alfa Romeo 146 | `KIT 53` | ? | |
| `8b7cfc82-ce23-4f3d-9409-e272032e9304` | Portatabla Eliptico Golf Iv 3p 97-03 | `KIT 54` | ? | |
| `fd7ecc1f-cbfa-4778-84d2-b4f08ff5e616` | Portatabla Eliptico Hyundai H-1 97-08 | `KIT 120` | ? | |
| `3df01985-e28e-4220-87b9-6f3646466807` | Portatabla Eliptico Kwid F 500/trend/cronos/argo 308 5p/ka+16/ Fiesta 03 5p/focus 13 4-5p Nvo/ecoesport/fiesta 10 5p/ranger 13dc/focus 15 4-5p Meriva | `KIT 52` | ? | ⚠️ *Requiere renombre manual (nombre >100 caracteres)* |
| `d1646052-d690-4d7f-a060-2c7355bc597d` | Portatabla Eliptico Megane Ii 4p 99-10 / 307 5p 3p 04-11/ 407 4p / Focus 4-5p 08-11/ Vectra Gt 5p / Bmw 328 325 / S Max / C4 5 P / Amarok | `KIT 37` | ? | ⚠️ *Requiere renombre manual (nombre >100 caracteres)* |
| `b5c3935f-82e3-413c-b3e1-29b5e371e8c8` | Portatabla Eliptico Moby 5p 16/22 -Renault 19 / Clio 5p 90-98 / Clio Ii 5-4p Symbol / Laguna Ii 06-08 / 106 5p 04-10 / Onix Prisma | `KIT 21` | ? | ⚠️ *Requiere renombre manual (nombre >100 caracteres)* |
| `beeb2679-15d5-4b07-ab15-2fb0404d431a` | Portatabla Eliptico Palio 3 P 97/01 | `KIT 14` | ? | |
| `0210f204-05be-406c-b91f-fffd5d83095a` | Portatabla Eliptico Palio 5p 2013 / Grand Siena 12/17 | `KIT 18` | ? | |
| `30c43195-3f59-4470-9e4d-26186a9b4da8` | Portatabla Eliptico Peugeot 208 5p 13-19 / Focus 5p 99-07 / Fox 5p 04-21 | `KIT 45` | ? | |
| `14753122-1de3-494b-aa78-3ece815ca9b3` | Portatabla Eliptico Polo 2017- 2025 5 P | `KIT 59` | ? | |
| `61432c65-b81b-4ac5-b7db-6693429fd695` | Portatabla Eliptico Punto 07/17 - Capture 16/23 - 208 5p 20/25 - C4 - Lounge 13/21 (1.20) | `KIT 17` | ? | |
| `d1395933-48bd-46ca-b5b6-8efba247bf40` | Portatabla Eliptico Ram Rampage / Gol 3p 95-05 / Nissan Tiida 08-15 | `KIT 50` | ? | |
| `dc0e0341-2a6a-4fff-b5c3-8c4f0c484259` | Portatabla Eliptico Ranger Doble Cab 95-12 / Chrysler Pt Cruiser 01-10 | `KIT 46` | ? | |
| `8f11280a-8e1c-41ce-8df9-24af00840d93` | Portatabla Eliptico Regata , Fiesta 95/01 5p , Honda City 4p 2009/2015 | `KIT 13` | ? | |
| `cc5c0e2c-3b92-4246-99b2-21c4fd95df0a` | Portatabla Eliptico Renault 18 | `KIT 20` | ? | |
| `fcdd183f-26ac-461d-8e0e-c1155ef5052f` | Portatabla Eliptico Renault Megane | `KIT 22` | ? | |
| `01ac5f64-2dab-4c53-b7b8-ce5cb1e69abc` | Portatabla Eliptico Renault Twingo | `KIT 25` | ? | |
| `1ee73986-ee31-4846-97e6-2bde41a5aa68` | Portatabla Eliptico Uno 3 Ptas 89/04 | `KIT 11` | ? | |
| `9a97c7c8-fc71-48b6-bcd4-4a51ac1a8ddc` | Portatabla Eliptico Vento 13-18 / Sonic 4-5 P / Up 3-5 P | `KIT 56` | ? | |
| `897c781e-9f1f-4555-b48d-72116d2a7a5b` | Portatabla Eliptico Volkswagen Amarok | `AE-5950` | ? | |
| `73790669-d159-4087-b484-9085417a8c74` | Portatabla Eliptico Xsara - Picasso 2001-2013 | `KIT 65` | ? | |
| `9f9c4fe8-0972-472d-954d-d4363717e3bc` | Portatabla Fiat Qubo Furgon | `AE 1075N` | ? | |
| `e807c464-51f4-48c2-ad2a-28c95f284ae4` | Portatabla Ford Fiesta Kinetic Sin Barra Longitudinal | `328213` | ? | |
| `ce295a40-c0d8-4520-82bd-37870d51b2c0` | Portatabla Para Ford Ecosport 2010 | `SM 8310 N` | ? | |
| `eb41baf7-dfe5-4a75-a181-d4ac28b3505a` | Portatabla Rs Rural Negro | `1080` | ? | |
| `496f8879-0ad4-4e2d-b1d0-8fceff2a2641` | Portatabla Sistema Multiple Negro 1.50 Mts | `SM-8300 N 1.5` | ? | |
| `0f9e86d9-f094-4e59-b143-3093ad45bce6` | Portatabla Sistema Multiple Univ ( Rural ) Negro | `SM-8300 N` | ? | |
| `a689b6e4-c88e-4e15-a46f-8c2aa5b4d3d4` | Portatabla Univ Adap Kangoo Ca¥o Aluminio | `JB-011` | ? | |
| `cffd8dac-33c6-4862-b320-55826cbfd13b` | Portatabla Univ Rural Caño Negro Economico | `JB-101` | ? | |
| `ca688d56-f42d-4fb8-b134-78d4d4c2db07` | Portatabla Univ Rural Con Llave Caño Aluminio | `JB-002` | ? | |
| `3eda0e22-b0cc-4663-97e5-ae25f361e3f5` | Portatabla Univ Rural Con Llave Chi Caño Hierro | `JB-001` | ? | |
| `70dfea8f-f467-4dc5-834d-8893a57ea554` | Portatabla Univ Tipo Rural Baranda + 2 Pisos 160 X 140 Cm | `JB-004` | ? | |
| `33ce45ea-460d-437e-9529-cb121b25d134` | Red Elastica Con Ganchos De Metal 30 X 30 Cm | `TE-006` | ? | |
| `05a01098-ecbc-430e-94ad-509fadfeacdb` | Red Elastica P/carga 70 X 90 Cm Iael | `TE-003` | ? | |
| `e5732138-26d0-4064-801b-9ec2d776cb9f` | Soga De Remolque Metalica 6mm 4m | `LI-004` | ? | |
| `c07ab205-1406-4785-ade5-f4f840d3ad38` | Tensor 4pcs/set Iael 50 Cm 8 Brazos | `TE-007` | ? | |

| **SQL — Renombrar productos** |
|---|---|
⚠️ *3 producto(s) requieren renombre manual (nombres muy largos >100 caracteres)*

---

### 9. Accesorios Interior

**SQL — Crear categoría:**
```sql
INSERT INTO category (id, name, description, color, "sortOrder", "isActive")
VALUES ('cat-interior', 'Accesorios Interior', 'Alfombras, cubre volantes, fundas de asiento, cortinas parasol, palancas de cambio, posavasos, llaveros, soportes para celular, portapatentes', '#EC4899', 9, true);
```

**SQL — Asignar productos a esta categoría:**
```sql
UPDATE product SET "categoryId" = 'cat-interior' WHERE id IN (
  'a6193ce1-eff1-48b2-ad6e-1e602155010d',
  '0125fa02-4a55-40c3-a739-c49ee9943d43',
  '92e4f461-7761-4716-bbda-9e06c8967317',
  'f1360f41-6461-451c-bc4e-3196a3602dcb',
  '2ccb6f21-706f-4cca-a570-56b02ccc8c92',
  '075f268b-d316-4c52-a770-85c5dc29feb8',
  '6af0d3ed-90c5-4ff5-b716-32e172890f0a',
  '13e29fda-af64-4a96-b69d-e1ecbbf79dad',
  '53fc3dbc-ff25-41c7-8bf5-e5b555b1ac16',
  '998e9870-8e98-42ce-b0ef-1fa0a5a429f9',
  'fae5b3f4-5dbf-474a-9a3d-2d5ca18af304',
  'ac5a7ece-7faf-4481-8245-e5b0835ff8f5',
  'a203595e-778e-44ff-9560-b4772c54eccc',
  '12639bd8-27fe-4346-9ed7-c3f7586cf22e',
  'b6468ac9-12ca-42a3-90c7-52ae801ea554',
  '82683f55-e493-4f1d-9389-de64a45fa42b',
  '728b07fc-3a03-440a-bb55-777bd3008806',
  '8e6ec24f-b540-4fd8-90cb-2e2f0193b5ba',
  'e04f8975-470e-4fa0-8286-a2db50c142e0',
  '6cd6137c-dca8-4ab0-98c7-e36ac533080b',
  '504f1d88-6b83-46e1-96f5-ac585924b88c',
  'aa3e7bf7-c92e-4834-9eb0-83a1d8a9b402',
  'afe3f041-0047-469c-97b8-0d66855d9b6e',
  '193e993c-bdda-4128-9ad2-3bce46499137',
  'fdef4322-4ea3-4fb1-842e-fdf5e08a1de3',
  '80d2cf16-3e58-4208-89ce-435221f10851',
  '584e69cb-cd2c-4e50-90f4-a9f2abd00cb5',
  '0c74470d-7e3c-462e-b6e0-901f1ac0b7ed',
  '29763c6f-c983-4dfb-98cd-cd1a294e4a6e',
  '1a6d967d-d0cc-4d33-8515-50de1e0f4788',
  'ef3c2ea8-ea62-4a75-ac2a-1529437b9206',
  'd244b2f1-14e8-4c88-9248-27ad0febd181',
  'e9c2693a-6d66-46cd-9416-98724914ba78',
  '8939e533-68e2-4923-a61b-6b1719c7760a',
  'db705eec-d7a8-4d4a-8991-0f957a284df9',
  'a9c975d2-cbf9-4be1-9858-fdb3b38cadfd',
  '7f3eeee1-4f28-4553-b51b-c568261e8061',
  '00977e43-0f51-45b2-8aaf-8d8e47d852d5',
  '3d4c8819-eb19-42e8-ba85-0c1a6dc77279',
  '94111310-6970-4fe5-8307-65f361ab6a91',
  'f9643d86-aa90-4ff7-8eb4-f5dd7bcc208c',
  '94a5eb42-d6ae-46e6-b0eb-117b13ca084d',
  '92558ce2-d702-4fad-bd13-8d295570a9f2',
  'd32e5783-4a1b-4cd2-a120-683c8e84ce42',
  '5feb21a8-16d0-4f82-a27f-d0d4ab7a8473',
  '12063392-ca96-48e7-bfba-51a6a6ec5aa0',
  '74c0bc71-09e2-4f1e-80cd-ed3c0a22b6db',
  'a6010069-fee2-4efd-9434-1f1b8b442c6b',
  '2aac3a15-a5a5-4fc8-b725-cbe06abbffe2',
  '1aa993cd-fb07-45f4-94b7-cf1478477a18',
  'cefce8d5-10ff-4134-a0f8-f0bb92e5960f',
  '1111e349-413c-4713-951f-fa035fe0c08e',
  'bbe923da-2c27-43ad-953b-c608a8c64567',
  '33069c3d-c377-4666-84cb-cedb3e3f2392',
  '8b4c355c-23c8-4d37-9e58-23b4aab1fe39',
  'ab642133-6492-4d70-a493-ddbff7d1b175',
  '86eae129-cf07-47be-8e86-c9d93cf1bfe8',
  '9ceaa8d4-cd73-4b91-8c44-29438cc00648',
  '599caf9a-ec8d-41fd-8541-81f7d8ec2997',
  '470cc08b-f17e-4faf-84f8-aa8f0c94b729',
  '3eb5eb9c-7d21-4384-91f3-2b39ac450c93',
  'e82b18aa-eccd-4fbb-a238-72008adc4e6e',
  'e7b65a54-43cd-4ca5-9e11-f921a25e1cd7',
  'a898868b-ddcc-47b9-ba77-f3205c1163eb',
  '306a39c0-2f51-4d64-a3b9-de2997c3697e',
  '555fc025-b5c2-4c44-85b1-65d97321ab34',
  '0556a2ad-0e4b-40bc-aefb-b42b70b5985a',
  '936434e3-1175-4af7-83ef-f08610a86851',
  '31ae637a-40c3-426d-a2f4-2536c37aaf28',
  '72cfc429-e064-452d-a58e-3973deab1f87',
  '157e9331-d853-430e-ae9f-ad1ab43b8f4f',
  'c6d3bb40-aaea-491d-a16c-4d8d849aa61b',
  'e81a7722-ec33-4d9c-9e66-ed2e1dc1f27c',
  '35b4e00b-144e-4155-be4b-e6887b38abc3',
  'ab36e335-1b40-4ddb-bd7c-d7b1f2ca80c5',
  '07259b65-b8ba-4b8d-94bf-1eb8999b4f9a',
  '471d6028-8d6a-4248-a297-21b0ceeafd2d',
  '9552bb5f-317b-4231-9794-aec8c82321cd',
  '29d49c19-5e68-4e6e-b08c-a86c72274fc0',
  'c64a9db7-928d-4404-875d-e539c36c5ce2',
  '4f13aaf8-74cc-4c44-9034-67a162441d4f',
  'b6afd23b-4efd-4a28-8f07-ce372e744374',
  'b4427476-b201-43a1-a3e3-48ef9f9981a6',
  'prod-1781277472520-x84cnr502',
  '5543dddd-c52f-499e-821f-01272770165f',
  'c8a04f3e-2529-4111-a46f-ee0c3c8d2021',
  '39f4acc4-1d66-4b5d-82a4-70d2961861f1',
  '238ea1a2-108d-4224-8e49-590065f947fc',
  '6a05916c-3dd5-4335-909c-07bf52323f8b',
  'e551f84f-160d-4d4b-abc4-1b40f9ecc0f5',
  'd1b2fc0e-5bd1-4f10-8b32-b01530483977',
  'aa3a355b-5eb2-45d0-a1d7-51c6965faa1e',
  '8151354f-6222-4fcf-9b76-4d605015cade',
  '1380feed-beea-4f7b-8790-1c1d3286a469',
  '8c93653c-e792-4e3d-aba4-f7005a4f8bf1',
  '9c7e1d13-3779-46bf-8b42-42da43e45928',
  '5a54af7b-99de-4752-9c73-2d77d7e40d6f',
  '79927d45-354e-4e80-ba73-2de82dc47e22',
  'dbb8a199-410a-44e7-89c7-74d69bb9cfe4',
  'c425c3c0-1859-4e31-b1a8-56d458951816',
  'acf52ebc-3b09-4028-8274-54cf103cf2db',
  '05d7d8a3-2922-4663-bfe2-d6b1ed61064b',
  'bdc319ee-e6b6-47e3-a48a-4e441764c6c1',
  'ebb1a90b-6461-4b63-a097-8165c5b622c9',
  '571804e7-9638-469c-9bbf-c0e3992813fe',
  'f255bd7d-bc6e-45c9-acdc-56b4eb724dba',
  '8126d8a8-fdcb-4df9-9e2c-fd61e71b987b',
  '2a67450f-68e5-48f4-9aac-34d81a09dd07',
  'prod-1780942294045-ulx6p71aj',
  'prod-1780942389713-4uqo05chi'
);
```

**Productos (110):**

| ID | Nombre actual | SKU | Stock | Sugerencia |
|---|---|---|---|---|
| `a6193ce1-eff1-48b2-ad6e-1e602155010d` | Alfombra Juego 2 Piezas Iael | `CF-027` | ? | |
| `0125fa02-4a55-40c3-a739-c49ee9943d43` | Alfombra Juego 3 Piezas Enteriza Pvc | `CF-032` | ? | |
| `92e4f461-7761-4716-bbda-9e06c8967317` | Alfombra Juego 4 Piezas Con Aplique Gris Plata Alta Calidad Pvc | `CF-030G` | ? | |
| `f1360f41-6461-451c-bc4e-3196a3602dcb` | Alfombra Juego 4 Piezas Con Aplique Rojo Plata Alta Calidad Pvc | `CF-030R` | ? | |
| `2ccb6f21-706f-4cca-a570-56b02ccc8c92` | Alfombra Juego 4 Piezas Deportiva (Azul) Iael | `CF-018A` | ? | |
| `075f268b-d316-4c52-a770-85c5dc29feb8` | Alfombra Juego 4 Piezas Deportiva (Plateada) Con Goma Gris | `CF-018G` | ? | |
| `6af0d3ed-90c5-4ff5-b716-32e172890f0a` | Alfombra Juego 4 Piezas Deportiva (Roja) Con Goma Roja | `CF-018R` | ? | |
| `13e29fda-af64-4a96-b69d-e1ecbbf79dad` | Alfombra Juego 4 Piezas Iael Cf022 | `CF-022` | ? | |
| `53fc3dbc-ff25-41c7-8bf5-e5b555b1ac16` | Alfombra Juego 4 Piezas Negra Gruesa | `CF-021` | ? | |
| `998e9870-8e98-42ce-b0ef-1fa0a5a429f9` | Alfombra Juego 4 Piezas Super Pesada Pvc | `CF-031` | ? | |
| `fae5b3f4-5dbf-474a-9a3d-2d5ca18af304` | Alfombra Juego Goma 4 Piezas Linea Roja Gruesa | `CF-033` | ? | |
| `ac5a7ece-7faf-4481-8245-e5b0835ff8f5` | Alfombra Juego Negra Con Aplique Cormado Lujo 4 Piezas | `CF-029` | ? | |
| `a203595e-778e-44ff-9560-b4772c54eccc` | Alfombra Juego Pvc 4 Piezas | `CF-034` | ? | |
| `12639bd8-27fe-4346-9ed7-c3f7586cf22e` | Alfombra Termoformada Amarok | `IT-VWA2012` | ? | |
| `b6468ac9-12ca-42a3-90c7-52ae801ea554` | Aplique Cromado Aro Palanca De Cambios Fox | `IC-VW-5474` | ? | |
| `82683f55-e493-4f1d-9389-de64a45fa42b` | Bocha P/palanca De Cambio Alta Pulida S/marchas Tipo Original | `PE-069` | ? | |
| `728b07fc-3a03-440a-bb55-777bd3008806` | Bocha P/palanca De Cambio Bora | `PPC2000` | ? | |
| `8e6ec24f-b540-4fd8-90cb-2e2f0193b5ba` | Bocha P/palanca De Cambio Combinada Cromada Cuerina Azul Con Cu¥as Iael | `PE-067A` | ? | |
| `e04f8975-470e-4fa0-8286-a2db50c142e0` | Bocha P/palanca De Cambio Fiat / Peugeot | `PPC2012` | ? | |
| `6cd6137c-dca8-4ab0-98c7-e36ac533080b` | Bocha P/palanca De Cambio Ford 6ta | `PPC2009` | ? | |
| `504f1d88-6b83-46e1-96f5-ac585924b88c` | Bocha P/palanca De Cambio Metal | `PPC2005` | ? | |
| `aa3e7bf7-c92e-4834-9eb0-83a1d8a9b402` | Bocha P/palanca De Cambio Redonda. | `PE-056` | ? | |
| `afe3f041-0047-469c-97b8-0d66855d9b6e` | Bocha P/palanca De Cambio Tipo Pera Alta Abs C/azul Parte Sup | `PE-017` | ? | |
| `193e993c-bdda-4128-9ad2-3bce46499137` | Bocha P/palanca De Cambio Tipo Pera Alta Abs C/negro Parte Sup | `PE-016` | ? | |
| `fdef4322-4ea3-4fb1-842e-fdf5e08a1de3` | Bocha P/palanca De Cambio Tipo Pera Alta Abs C/rojo Parte Sup | `PE-018` | ? | |
| `80d2cf16-3e58-4208-89ce-435221f10851` | Clip Hebilla Antialarma Para Cinturon Unidad | `CLIP1` | ? | |
| `584e69cb-cd2c-4e50-90f4-a9f2abd00cb5` | Cortina Reflectiva 130 X 60 Para Parabrisa | `CO-007` | ? | |
| `0c74470d-7e3c-462e-b6e0-901f1ac0b7ed` | Cortina Reflectiva 150 X 070 Para Parabrisa | `CO-009` | ? | |
| `29763c6f-c983-4dfb-98cd-cd1a294e4a6e` | Cortinas Parasol Plegable 100 X 50 Cm Iael | `CO-008` | ? | |
| `1a6d967d-d0cc-4d33-8515-50de1e0f4788` | Cortinas Parasol Plegable 44 X 38 Cm Iael | `CO-006` | ? | |
| `ef3c2ea8-ea62-4a75-ac2a-1529437b9206` | Cubre Volante 2 Piezas Carbono Azul | `CV-061A` | ? | |
| `d244b2f1-14e8-4c88-9248-27ad0febd181` | Cubre Volante 2 Piezas Carbono Negro | `CV-061N` | ? | |
| `e9c2693a-6d66-46cd-9416-98724914ba78` | Cubre Volante 2 Piezas Carbono Rojo | `CV-061R` | ? | |
| `8939e533-68e2-4923-a61b-6b1719c7760a` | Cubre Volante 36 Cm Base Plana Negro Combinado | `CV-053` | ? | |
| `db705eec-d7a8-4d4a-8991-0f957a284df9` | Cubre Volante 38 Cm Base Plana Negro Con Gris | `CV-054G` | ? | |
| `a9c975d2-cbf9-4be1-9858-fdb3b38cadfd` | Cubre Volante 38 Cm Base Plana Negro Con Rojo | `CV-054R` | ? | |
| `7f3eeee1-4f28-4553-b51b-c568261e8061` | Cubre Volante 38 Cm De Lujo Cuerina Conbinada Roja | `CV-019R` | ? | |
| `00977e43-0f51-45b2-8aaf-8d8e47d852d5` | Cubre Volante 38 Cm Pvc Turbo | `ACUB-74610BK` | ? | |
| `3d4c8819-eb19-42e8-ba85-0c1a6dc77279` | Cubre Volante 38 Cm Tela Y Cuerina | `CV-017` | ? | |
| `94111310-6970-4fe5-8307-65f361ab6a91` | Cubre Volante 38cm De Lujo Cuerina Combinada Azul 38 Cm | `CV-019A` | ? | |
| `f9643d86-aa90-4ff7-8eb4-f5dd7bcc208c` | Cubre Volante Animal Print 38 Cm | `CV-049` | ? | |
| `94a5eb42-d6ae-46e6-b0eb-117b13ca084d` | Cubre Volante Animal Print Blanco C/ Negro 38 Cm | `CV-047` | ? | |
| `92558ce2-d702-4fad-bd13-8d295570a9f2` | Cubre Volante Base Plana 38 Cm Negro | `CV-043` | ? | |
| `d32e5783-4a1b-4cd2-a120-683c8e84ce42` | Cubre Volante Cuerina Simil Carbono Terxturado 38 Cm | `CV-045` | ? | |
| `5feb21a8-16d0-4f82-a27f-d0d4ab7a8473` | Cubre Volante Cuero Con Costura | `CV-060` | ? | |
| `12063392-ca96-48e7-bfba-51a6a6ec5aa0` | Cubre Volante Curvs 38cm Negro Con Gris | `CV-039` | ? | |
| `74c0bc71-09e2-4f1e-80cd-ed3c0a22b6db` | Cubre Volante De Lujo Cuerina Combinada Gris C/negro | `CV-019GC` | ? | |
| `a6010069-fee2-4efd-9434-1f1b8b442c6b` | Cubre Volante Elastizadocv-021g | `CV-021G` | ? | |
| `2aac3a15-a5a5-4fc8-b725-cbe06abbffe2` | Cubre Volante Forrado Cuerina 38 Cm | `CV-028` | ? | |
| `1aa993cd-fb07-45f4-94b7-cf1478477a18` | Cubre Volante Forrado En Cuerina 36 Cm | `CV-026` | ? | |
| `cefce8d5-10ff-4134-a0f8-f0bb92e5960f` | Cubre Volante Forrado En Cuero | `CV-028C` | ? | |
| `1111e349-413c-4713-951f-fa035fe0c08e` | Cubre Volante Forrado Negro Plata | `CV-022` | ? | |
| `bbe923da-2c27-43ad-953b-c608a8c64567` | Cubre Volante Gamuza Con Brillos Diamond | `CV-059` | ? | |
| `33069c3d-c377-4666-84cb-cedb3e3f2392` | Cubre Volante Milo 38 Cm Negro/rojo | `CV-033R` | ? | |
| `8b4c355c-23c8-4d37-9e58-23b4aab1fe39` | Cubre Volante Milo 38 Cm Negro/rosa | `CV-033PI` | ? | |
| `ab642133-6492-4d70-a493-ddbff7d1b175` | Cubre Volante Milo 38 Cm Negro/turquesa | `CV-033TU` | ? | |
| `86eae129-cf07-47be-8e86-c9d93cf1bfe8` | Cubre Volante Milo 38 Cm Negro/violeta | `CV-033VI` | ? | |
| `9ceaa8d4-cd73-4b91-8c44-29438cc00648` | Cubre Volante Milo Negro Con Gris | `CV-033G` | ? | |
| `599caf9a-ec8d-41fd-8541-81f7d8ec2997` | Cubre Volante Negro 38 Cm | `GY-5583` | ? | |
| `470cc08b-f17e-4faf-84f8-aa8f0c94b729` | Cubre Volante Negro Con Aro Cromado | `CV-023` | ? | |
| `3eb5eb9c-7d21-4384-91f3-2b39ac450c93` | Cubre Volante Negro Con Azul 38 Cm | `GY-5585` | ? | |
| `e82b18aa-eccd-4fbb-a238-72008adc4e6e` | Cubre Volante Negro Con Azul Reflectivo | `CV-027A` | ? | |
| `e7b65a54-43cd-4ca5-9e11-f921a25e1cd7` | Cubre Volante Negro Con Gris 38 Cm | `GY-5584` | ? | |
| `a898868b-ddcc-47b9-ba77-f3205c1163eb` | Cubre Volante Negro Con Gris Reflectivo | `CV-027G` | ? | |
| `306a39c0-2f51-4d64-a3b9-de2997c3697e` | Cubre Volante Negro Con Rojo 38 Cm | `GY-5586` | ? | |
| `555fc025-b5c2-4c44-85b1-65d97321ab34` | Cubre Volante Pvc 38 Cm Gris | `ACUB-72803G` | ? | |
| `0556a2ad-0e4b-40bc-aefb-b42b70b5985a` | Cubre Volante Pvc 38 Cm Rojo | `ACUB-72803R` | ? | |
| `936434e3-1175-4af7-83ef-f08610a86851` | Cubre Volante Simil Cuero Soft Huellas 38 Cm | `CV-044` | ? | |
| `31ae637a-40c3-426d-a2f4-2536c37aaf28` | Cubre Volante Spider 38 Cm Negro/azul | `CV-034A` | ? | |
| `72cfc429-e064-452d-a58e-3973deab1f87` | Cubre Volante Spider 38 Cm Negro/gris | `CV-034G` | ? | |
| `157e9331-d853-430e-ae9f-ad1ab43b8f4f` | Cubre Volante Spider 38 Cm Negro/rojo | `CV-034R` | ? | |
| `c6d3bb40-aaea-491d-a16c-4d8d849aa61b` | Cubre Volante Y Cubre Cinturones De Seguridad | `CV-018G` | ? | |
| `e81a7722-ec33-4d9c-9e66-ed2e1dc1f27c` | Cubre Volante Y Cubre Cinturones De Seguridad Azul | `CV-018A` | ? | |
| `35b4e00b-144e-4155-be4b-e6887b38abc3` | Cubre Volante Y Cubre Cinturones De Seguridad Rojo | `CV-018R` | ? | |
| `ab36e335-1b40-4ddb-bd7c-d7b1f2ca80c5` | Cubre Volante Zig Zag 38 Cm Negro C/ Rosa | `CV-036PI` | ? | |
| `07259b65-b8ba-4b8d-94bf-1eb8999b4f9a` | Funda Afb Especifica Ford Falcon S/ Cuero Asiento Y Respaldo Entero | `AFB-FALCON` | ? | |
| `471d6028-8d6a-4248-a297-21b0ceeafd2d` | Funda Afb Especifica Ford Ranger C/simple "I" Respaldo Apoyacab Separado Asiento 1/3 Y Apoyabrazo | `AFBRANGER I` | ? | |
| `9552bb5f-317b-4231-9794-aec8c82321cd` | Funda Afb Universal Simil Cuero Asiento Y Respaldo Repartido | `AFB-UNIVERSAL` | ? | |
| `29d49c19-5e68-4e6e-b08c-a86c72274fc0` | Funda Fitter Especifica Toyota Hilux 16" C/doble Respaldo Entero Asientos Repartidos Simil Cuero | `FITTER-HILUX` | ? | |
| `c64a9db7-928d-4404-875d-e539c36c5ce2` | Funda Fitter Univerasal Asiento Delantero Monja | `FITTER-PRISMA` | ? | |
| `4f13aaf8-74cc-4c44-9034-67a162441d4f` | Juego Cubre Alfombra Animal Print | `CF-900LG` | ? | |
| `b6afd23b-4efd-4a28-8f07-ce372e744374` | Llavero Auto Comun | `LV-006TC` | ? | |
| `b4427476-b201-43a1-a3e3-48ef9f9981a6` | Llavero Camion | `1541` | ? | |
| `prod-1781277472520-x84cnr502` | LLAVERO CHAPA IMPRESO ECONOMICO | `PRD-1781277472520-27DPW` | ? | ⚠️ → "Llavero Chapa Impreso Economico" *(ALL CAPS name)* |
| `5543dddd-c52f-499e-821f-01272770165f` | Llavero Chevrolet Metalico | `1586` | ? | |
| `c8a04f3e-2529-4111-a46f-ee0c3c8d2021` | Llavero Cuero Audi | `7121` | ? | |
| `39f4acc4-1d66-4b5d-82a4-70d2961861f1` | Llavero Cuero Boca | `7125` | ? | |
| `238ea1a2-108d-4224-8e49-590065f947fc` | Llavero Espiral | `1550` | ? | |
| `6a05916c-3dd5-4335-909c-07bf52323f8b` | Llavero Gancho Fiat | `GANFIAT` | ? | |
| `e551f84f-160d-4d4b-abc4-1b40f9ecc0f5` | Llavero Gancho Peugeot | `GANPEUGEOT` | ? | |
| `d1b2fc0e-5bd1-4f10-8b32-b01530483977` | Llavero Honda Metalico | `LLAVHON` | ? | |
| `aa3a355b-5eb2-45d0-a1d7-51c6965faa1e` | Llavero Hyundai Metalico | `LLAVHY` | ? | |
| `8151354f-6222-4fcf-9b76-4d605015cade` | Llavero Intercooler | `1542` | ? | |
| `1380feed-beea-4f7b-8790-1c1d3286a469` | Llavero Kia Metalico | `LLAVKIA` | ? | |
| `8c93653c-e792-4e3d-aba4-f7005a4f8bf1` | Llavero Metalico Fiat | `1547` | ? | |
| `9c7e1d13-3779-46bf-8b42-42da43e45928` | Llavero Nos Nitro Garrafa | `6244` | ? | |
| `5a54af7b-99de-4752-9c73-2d77d7e40d6f` | Llavero Tunning (Butaca Deportivo) | `LV-005` | ? | |
| `79927d45-354e-4e80-ba73-2de82dc47e22` | Llavero Tunning (Filtro Deportivo) | `LV-005F` | ? | |
| `dbb8a199-410a-44e7-89c7-74d69bb9cfe4` | Llavero Tunning (Freno Disco) | `LV-004D` | ? | |
| `c425c3c0-1859-4e31-b1a8-56d458951816` | Llavero Tunning (Piston) | `LV-004P` | ? | |
| `acf52ebc-3b09-4028-8274-54cf103cf2db` | Llavero Turbo | `LV-004T` | ? | |
| `05d7d8a3-2922-4663-bfe2-d6b1ed61064b` | Marco Cromado Palanca De Cambio Accent 99/clio 98/golf A3/a6 | `JM-41209` | ? | |
| `bdc319ee-e6b6-47e3-a48a-4e441764c6c1` | Marco Cromado Palanca De Cambio Accent 99/twi/polo 95/merce | `JM-41203` | ? | |
| `ebb1a90b-6461-4b63-a097-8165c5b622c9` | Marco P/palanca De Cambio Uno/duna | `FR8003` | ? | |
| `571804e7-9638-469c-9bbf-c0e3992813fe` | Porta Celular Doble Pinzas Regulable | `VA-098` | ? | |
| `f255bd7d-bc6e-45c9-acdc-56b4eb724dba` | Porta Celular Magnetico Para Tablero | `VA-078` | ? | |
| `8126d8a8-fdcb-4df9-9e2c-fd61e71b987b` | Porta Celular Para Bicicleta Y Moto | `VA-103` | ? | |
| `2a67450f-68e5-48f4-9aac-34d81a09dd07` | Portabicicletas Para Techo | `80250` | ? | |
| `prod-1780942294045-ulx6p71aj` | Portalámpara muelita T10 | `PRD-1780942294045-VLY93` | ? | |
| `prod-1780942389713-4uqo05chi` | Portalámpara muelita T10 | `1242` | ? | |

| **SQL — Renombrar productos** |
|---|---|
```sql
UPDATE product SET name = 'Llavero Chapa Impreso Economico' WHERE id = 'prod-1781277472520-x84cnr502';
```

---

### 10. Fundas y Carcasas

**SQL — Crear categoría:**
```sql
INSERT INTO category (id, name, description, color, "sortOrder", "isActive")
VALUES ('cat-fundas', 'Fundas y Carcasas', 'Fundas de llave, carcasas de llave', '#14B8A6', 10, true);
```

**SQL — Asignar productos a esta categoría:**
```sql
UPDATE product SET "categoryId" = 'cat-fundas' WHERE id IN (
  '62175a59-3059-40b7-845f-be87e235d49b',
  'fad55ac8-fcef-4051-81c4-27cac4914089',
  '5263fa3f-c9c2-41b7-9280-7613d3f658d7',
  '41a954ac-bab1-4562-a884-4ecbff592b81'
);
```

**Productos (4):**

| ID | Nombre | SKU | Stock |
|---|---|---|---|
| `62175a59-3059-40b7-845f-be87e235d49b` | Carcasa Llave Citroen Y Peugeot 2 Botones | `KS01` | ? |
| `fad55ac8-fcef-4051-81c4-27cac4914089` | Carcasa Llave Peugeot Navaja 2 Botones | `KS05NAVAJA` | ? |
| `5263fa3f-c9c2-41b7-9280-7613d3f658d7` | Carcasa Llave Renault Duster Oroch 2 Botones | `KS41C` | ? |
| `41a954ac-bab1-4562-a884-4ecbff592b81` | Carcasa Llave Vw Navaja 2 Botones | `KS46I` | ? |

| **SQL — Renombrar productos** |
|---|---|
_No se requieren renombres en esta categoría._

---

### 11. Carrocería y Partes

**SQL — Crear categoría:**
```sql
INSERT INTO category (id, name, description, color, "sortOrder", "isActive")
VALUES ('cat-carroceria', 'Carrocería y Partes', 'Manijas, espejos, ópticas, parrillas, paragolpes, máscaras, vidrios, molduras', '#84CC16', 11, true);
```

**SQL — Asignar productos a esta categoría:**
```sql
UPDATE product SET "categoryId" = 'cat-carroceria' WHERE id IN (
  'f74e2b43-61fe-4653-a537-69561a764e3f',
  '73105f2a-0d6a-40dc-86ac-fb169dc4a393',
  '12c3425b-426b-4e0c-87e1-4b9a68c7b90f',
  'f48135db-9b4f-419f-823a-af93b3bc075b',
  '7f7f7995-3173-4fc8-99df-a9d4af8fc4bb',
  'c9cad6b9-1a26-468d-bd54-1dab856ff95c',
  'd4a4e342-af1d-4f8f-8bad-a7ffdc679f82',
  '7f8d665a-4d03-4ecc-be7c-590a90ff67e0',
  'f5d116ca-3625-4c44-90ae-deff038ea309',
  'c1f1b741-7a83-4a32-b3dc-3b8475d4f1bb',
  '765aef03-d1ae-499b-8bcf-19a6e8e9f319',
  '8410b820-96c4-4aa9-8cd6-532ec845b85d',
  'f35c2cee-b613-4168-9fe9-33922e383b4b',
  '0c3a8efc-7b8b-4043-80df-aa8c6025f2a0',
  '48ae6a38-c4e1-4f28-90a5-618547aaecdf',
  '67b8b9a3-1378-46da-a2f8-7596da849e52',
  '75bb013d-53c9-40b7-a75a-64b2492283f1',
  'c54bf84f-0213-4775-857d-365d91b75e32',
  '258ff366-5b75-4422-b273-55960703b5e3',
  '9b363a79-94a5-45e4-9bca-917a3884eea1',
  '5770b54a-54d9-4294-8b3c-46b56b30db8f',
  '929025b9-b84b-4157-888c-0b3f70766a17',
  '3e36c135-0d82-4389-abbc-8bc9a8e2265a',
  'c80ddd9d-dbe4-478b-b5a3-79e048c7dc76',
  'b701a351-88b8-4022-b892-9e77538db9ac',
  '40fefc5d-0cd6-4a69-9390-c84e563a70af',
  '7f81df91-1709-4c5e-bb9e-b784cc3faa63',
  'a9ef7682-900c-4f3b-814f-6934aa0cdda2',
  'bad29a75-c16d-4888-bcf2-347124d03bd7',
  'a7c7b64c-f989-4a9f-bc2e-ecce14162bce',
  '67f530f6-be24-497b-bd0a-4fd18edee64f',
  'ba4044dc-50ad-4efe-a0a8-ed4e646490e5',
  'd7ae8894-209c-4adb-8da7-65f4e88c9ef5',
  'b468387f-ccdd-48d3-acab-8b95ff219c89',
  'fa2c2233-b97b-4197-b8a3-bdc42c55af29',
  '6a7eeabd-d9c5-4144-ac78-26f36f00dc82',
  '6f8af01c-7855-4caf-ad2b-8b06e02d613f',
  '84fa3576-e4df-467e-a871-56fd47d4fe0f',
  '08bc9b32-4c1e-4bdb-9fad-39ec927e8d11',
  '8a205b6a-0575-481a-bdf9-9870bed7a37b',
  '9186a2c6-8db6-4e4c-b2f7-5add6a8afbc4',
  '4c71b6c5-053d-4c19-a283-dec84d897074',
  'b5ba94ed-0f79-4423-9b5f-166b59137ecd',
  '76f7cacd-6693-4973-bb40-510e8e3569bf',
  '2c5f1a8d-dd39-482f-bbb1-f84daf971807',
  '0ecaff74-29a8-4c9f-becf-6cd16cb5e894',
  '2d58a6ee-217f-426f-9d60-9939dd6df6d5',
  'a47d9b7d-4b3c-4e4f-8f51-67e5081d1cd7',
  'fad55620-74f1-457a-864c-cc318cae1a48',
  'f555e3bf-b5ea-4a59-8df8-e11e08474a4f',
  '9ce34616-c0f8-4055-87e8-c965ef6a7300',
  '99831d74-d57e-4f22-8b3f-70adffc0702c',
  '52231a06-21b5-419e-9235-34bc2fb270d7',
  'c0a9154c-56f0-412f-8ad0-b21de90d3695',
  'b2443d1e-debf-4e68-855e-3d737da81959',
  '29df0cc5-231f-4c64-9b65-2c9d4409d63d',
  '464ba313-5fd7-470c-bb63-c64ca54b7c37',
  '4b61c084-2ef5-495f-b395-b6c21e37b61e',
  'd964e7b5-ed86-4fa5-9de4-7f2c632bca06',
  '9d81c42d-1d66-4fa4-8081-fe5be5c28bb4',
  'adf74fe8-db27-473a-81b4-738926045306',
  '66646c0e-f320-4ed5-a43a-1298d0160591',
  '40276d88-47ff-4878-9150-7d7f8af49090',
  '646c1519-6604-4be0-bf14-73bab699b6fc',
  'd44643e9-77db-4bf4-9141-6f23cf8f784b',
  '5ff722fc-675e-4ffa-8165-46bf3b291c5c',
  '9d820377-ade1-4275-9bf4-57746532632f',
  '84d32d9c-536d-4147-a3c0-4c60d381cf8a',
  '5aaba2bf-7787-4058-bf9f-1f9b9d4ab32b',
  '70596933-315f-4aa7-ae89-cc26c10e520d',
  'b4d0c5d8-71b9-4323-91a3-c964312a6b54',
  '29aa0e4d-3c5f-49f0-a07c-fdce722ca982',
  '33a33322-d4b1-42c5-8ae5-7c55c3eef699',
  'afcbd5e3-be55-4677-a3bd-5c9c634feb56',
  'c289cd7f-f7a6-44ca-9b39-36641764b785',
  '6f8e31dc-780d-4975-b8d8-ba1274656349',
  '1869e2af-e064-4283-8ce3-58d03b4c09d4',
  '87f16e7f-fe25-446b-a306-4f1ca83b9705',
  '91c9c404-6056-4475-9c3e-a1e4e9a44e34',
  '1189058f-7d80-40e0-9c84-78a6bb69c835',
  '80d03ca2-9a8e-42f6-a6ef-5984aae1d8c9',
  '830e051d-5590-4078-a1b3-1dafe8221e81',
  'e6d33b64-0ec0-49a8-8315-728aa2267e70',
  '64838a46-f8f6-4be8-88ff-b27687da802e',
  '05e18650-4986-41e4-8110-773d9a0edbab',
  'da58c009-2bde-42a9-b617-8e1bcd80177f',
  '0667ea66-7081-44e5-948d-f5fd2009ec9e',
  '52b0d228-d497-498b-a978-54e2ae86161f',
  '4853204f-a55e-4896-b3cc-c26a91e20192',
  'b7361daf-f281-4d75-b872-aab464adf5d4',
  '0542b711-7516-4ec8-8b68-d1942d9a8fc1',
  '12eba3fe-028c-4062-aaf7-a5a23a3e11fa',
  '0d628f13-d54f-42f1-b854-14dff7c52023',
  '44054fb7-6ac3-4805-af38-59d2d22ef299',
  '03398fa3-5a34-4d5f-892f-9dbeb22a7a4e',
  'fe056130-1bed-4a86-b535-9fee736d2537',
  '2838b570-aee7-48aa-b6e7-29b2dd87ec86',
  '504ed794-4925-4b0c-ba7d-d6de98f44567',
  'ebd98543-3f2d-4acc-9e96-586af29a3fa7',
  'dec666c3-4b79-4bdd-829e-0b9baf4db339',
  'c5b7343a-7707-4818-addc-d4c0dcdc532c',
  'c181e61f-2831-4afd-839a-2083f701c394',
  'f4684ec6-d60c-4af3-ab38-a3a0cb85e255',
  'c6d5d35f-13e4-40a7-b8b0-1b5d2b919eb9',
  '849fccb0-3a91-4a0f-a8b2-c8d639efa4af',
  '0d81c499-7835-4fac-baac-69178c961780',
  '376801cb-e88a-4006-8d7a-894beef25a17',
  '6d4d5ba5-1ce9-4676-8e94-4eb2f88ad583',
  'fca6682a-f971-4cf1-99ea-8a6624505bc9',
  '9decedfa-8e9d-4d01-9236-84521a10b237',
  'ccde7861-7346-4432-a17a-1d5be75e3e30',
  '9de17751-8ed4-404c-83a2-1526977ca15c',
  '20b1ed73-3108-460e-a4eb-1d2ab2bd2d6c',
  'ad30d026-911c-4856-91e0-64df7e663b01',
  'ebbac19a-5d00-40c4-8d01-7a563a454d68',
  '8382fcd7-7876-47d2-87b6-9d3457ae08a3',
  '690c8487-89b3-44fb-84d2-1ade29b85657',
  'c74907ab-ec9c-4e59-8997-2b4b8af9f384',
  'bc516e55-72d5-4db7-b839-9b6e869c53c5',
  '1800c8cf-df5c-40a5-821c-d34af09e1183',
  '7e90c933-bf8b-4b3b-92f4-ce05b5d9d3d6',
  'c6a4ef06-191a-46d8-a89c-0dda5f4f716a',
  'f373c23d-95fe-47e3-8b1a-beac94aa4c1b',
  'c4b8257d-c9b1-4dec-b8fc-8a503bc17f96',
  '649f3be0-c0ec-41eb-8471-32c652e24271',
  '273aab5d-7402-454f-b36a-4b16d2c599a4',
  'd9420190-8a5d-4052-86a2-768579de8676',
  '0bb5f3ad-e668-4f57-b289-a3c7638b629e',
  'c81e04bf-4bfe-445d-985e-4807f2c89766',
  '0a4446d1-8f86-48df-b53d-458cd34d4f58',
  '02cd0821-f5a9-4cab-8f6e-5aad9b9b915a',
  '90122c78-2b33-4f88-a25e-5aabf5a65b77',
  'ab9a345c-3ccb-4528-96a5-607f6e27b83b',
  'b9468e0e-b480-43a3-be36-2a6f0c80f71f',
  'b624635b-4f52-4e9e-a556-f65c191d115f',
  '418437d7-1b4b-4490-99d5-84aa9924e30e',
  '79b129e9-f9a4-4e59-b6e0-f58d0cfd2b38',
  'd6cd2690-2594-4400-870b-7ed829ae8dc3',
  '920ad390-b3df-4fb1-bd7c-f4bacfda660b',
  '383144cb-672d-4375-b738-b5a81fca35a4',
  'b54a155d-5de2-470a-85ef-5981d1d1cfbd',
  'b1b247ab-66db-46c1-884d-a4ce2c7e3ec1',
  '10bc6b27-96fb-43b5-9d8c-51eca4d86490',
  'caff1ed5-541f-49be-9dfa-fe533b632dff',
  '44f22bc3-b39d-4177-bf3d-9d43b0b86d24',
  'd3888088-08d3-4685-b954-5c460002a67a',
  '4440ed08-ef2b-42a1-bb8b-3f6cf19bceda',
  '6319178c-d49d-4466-a6ce-266551667041',
  'fd7e9e2b-4e06-4d40-8d3b-2d4b59c03cf9',
  'ab1dd3da-7ae9-4741-91d8-4598f34aad94',
  '77c2b910-f95c-4480-aa1e-7a40c8682094',
  'ee4bec86-f1af-4b30-b327-caf86e67dbb7',
  '644a6a82-1456-402a-8860-81288f275dce',
  '39ebefb4-b1b0-40c7-8db5-9583214982f0',
  'ce5080d8-98b7-4d0a-b8dd-7ea298b33055',
  'bd75a044-dc23-4fb6-b511-8425db27d4d2',
  'f95e68dc-6dc0-4795-9f36-ebf2ba746795',
  '9e24403b-6761-482e-8fdd-9d579024e402',
  '3087d49e-6649-402d-8d0d-cc1bda327fc9',
  '7054ffe0-7463-441b-a5a5-6ca6adc56485',
  '6dde0557-8f38-4e86-a3b8-b265b7816eb8',
  'a7992f07-f939-4d73-bf7f-f66b3cd7f0e8',
  'f98bdba5-5bd1-447d-9ac2-3053bee532f1',
  'dff08dc5-22f5-409f-b545-3a02e0d31236',
  '5f23eea9-e6da-49ec-9944-9668cc513bdd',
  'eff9f8e9-6d40-431d-a422-1df8b74ae252',
  '3e75c1d9-32a7-477c-9fa6-9c0ff92a9868'
);
```

**Productos (167):**

| ID | Nombre | SKU | Stock |
|---|---|---|---|
| `f74e2b43-61fe-4653-a537-69561a764e3f` | Aplique Cromado (Guiño) X2 Ford Focus | `SP-41202-04C` | ? |
| `73105f2a-0d6a-40dc-86ac-fb169dc4a393` | Aplique Cromado Marco De Espejo Gol Gv (Trend) X2 | `JRE348MA` | ? |
| `12c3425b-426b-4e0c-87e1-4b9a68c7b90f` | Aplique Cromado P/moldura De Panel Interior Fox | `IC-VW-5473` | ? |
| `f48135db-9b4f-419f-823a-af93b3bc075b` | Aplique Cromado P/parrilla Peugeot 206/207 | `DB-190` | ? |
| `7f7f7995-3173-4fc8-99df-a9d4af8fc4bb` | Aplique Cromado P/parrilla Sup. Gol V Trend / Voyage / Saveiro ( 2 Piezas) | `RC-VW-5516` | ? |
| `c9cad6b9-1a26-468d-bd54-1dab856ff95c` | Aplique Cromado Para Rejilla De Ventilacion Fiesta/ecosport I Vieja | `IC-FO-2102` | ? |
| `d4a4e342-af1d-4f8f-8bad-a7ffdc679f82` | Aplique Cromado Para Rejilla De Ventilacion Suzuki Fun | `IC-SZ-7455` | ? |
| `7f8d665a-4d03-4ecc-be7c-590a90ff67e0` | Cubre Espejo Cromado Agile Derecho | `DJ374` | ? |
| `f5d116ca-3625-4c44-90ae-deff038ea309` | Cubre Espejo Cromado Astra -Todos Mod.- Derecho | `CE-CH-6303 DJ364` | ? |
| `c1f1b741-7a83-4a32-b3dc-3b8475d4f1bb` | Cubre Espejo Cromado Con Luz Toyota Hilux 2005 - 2015 (Juego) | `DB-154L` | ? |
| `765aef03-d1ae-499b-8bcf-19a6e8e9f319` | Cubre Espejo Cromado Gol Giii/iv/santana/golf/bora Derecho | `DJ350 - CE-VW-5440` | ? |
| `8410b820-96c4-4aa9-8cd6-532ec845b85d` | Cubre Espejo Cromado Partner / Berlingo (Juego) | `K103` | ? |
| `f35c2cee-b613-4168-9fe9-33922e383b4b` | Cubre Espejo Cromado Peugeot 405 (Juego) | `K102` | ? |
| `0c3a8efc-7b8b-4043-80df-aa8c6025f2a0` | Cubre Espejo Cromado Ranger 2013-2022 Izq | `CE-FO-2174` | ? |
| `48ae6a38-c4e1-4f28-90a5-618547aaecdf` | Cubre Manija Clio 2 Scenic X2 | `DJ306` | ? |
| `67b8b9a3-1378-46da-a2f8-7596da849e52` | Cubre Manija Cromada 206/207 X4 | `203` | ? |
| `75bb013d-53c9-40b7-a75a-64b2492283f1` | Cubre Manija Cromada Corsa 2002/... -Meriva 03 4 Ptas | `CM-CH-6260` | ? |
| `c54bf84f-0213-4775-857d-365d91b75e32` | Cubre Manija Cromada Corsa 94/01/vectra96/astra 98 4 Ptas | `DJ314` | ? |
| `258ff366-5b75-4422-b273-55960703b5e3` | Cubre Manija Cromada Escort 97/fiesta96/01/ka97 4 Ptas | `DJ308 - JRMAN308` | ? |
| `9b363a79-94a5-45e4-9bca-917a3884eea1` | Cubre Manija Cromada F100 Duty S/agujero | `DJ310` | ? |
| `5770b54a-54d9-4294-8b3c-46b56b30db8f` | Cubre Manija Cromada Fiat Idea 06/10 - Adventure Locker.../10 | `CM-FI-0562` | ? |
| `929025b9-b84b-4157-888c-0b3f70766a17` | Cubre Manija Cromada Fiat Uno 2011 4ptas. | `DJ317` | ? |
| `3e36c135-0d82-4389-abbc-8bc9a8e2265a` | Cubre Manija Cromada Gol Gv (Trend) -Golf 00-fox 2 Puertas | `712` | ? |
| `c80ddd9d-dbe4-478b-b5a3-79e048c7dc76` | Cubre Manija Cromada Gol V (Trend)/bora/golf Iv/fox/suran/voyage (X2) Ciega Sin Agujero Cerradura | `DB-108T` | ? |
| `b701a351-88b8-4022-b892-9e77538db9ac` | Cubre Manija Cromada Gol V (Trend)/bora/golf Iv/fox/suran/voyage (X2) Con Agujero Cerradura | `DB-108D` | ? |
| `40fefc5d-0cd6-4a69-9390-c84e563a70af` | Cubre Manija Cromada Hilux 05/15 2ptas | `DJ316` | ? |
| `7f81df91-1709-4c5e-bb9e-b784cc3faa63` | Cubre Manija Cromada Honda Crv 2007 / 2012 Civic 2012 / 2016 (X4) | `DB-119` | ? |
| `a9ef7682-900c-4f3b-814f-6934aa0cdda2` | Cubre Manija Cromada Honda Fit 2009/2016 | `JRMAN328` | ? |
| `bad29a75-c16d-4888-bcf2-347124d03bd7` | Cubre Manija Cromada Levanta Cristales Gol 97/.../fox | `CM-VW-5435` | ? |
| `a7c7b64c-f989-4a9f-bc2e-ecce14162bce` | Cubre Manija Cromada Nissan Tiida 2008 2015 X4 | `JRMAN331` | ? |
| `67f530f6-be24-497b-bd0a-4fd18edee64f` | Cubre Manija Cromada Onix Prisma Spin | `JRMAN345` | ? |
| `ba4044dc-50ad-4efe-a0a8-ed4e646490e5` | Cubre Manija Cromada Palio / Siena 4ptas 96/09 | `CM-FI-0429 / DJ311` | ? |
| `d7ae8894-209c-4adb-8da7-65f4e88c9ef5` | Cubre Manija Cromada Palio Elx 96/04 - Fire 96/06 - Siena X4 | `DB-111` | ? |
| `b468387f-ccdd-48d3-acab-8b95ff219c89` | Cubre Manija Cromada Palio/siena 96/06 X2 | `CMP` | ? |
| `fa2c2233-b97b-4197-b8a3-bdc42c55af29` | Cubre Manija Cromada Partner /106/berlingo 2000 / 2021 X2 | `CMPP` | ? |
| `6a7eeabd-d9c5-4144-ac78-26f36f00dc82` | Cubre Manija Cromada Peugeot 206 -207 X 4 | `DB-110` | ? |
| `6f8af01c-7855-4caf-ad2b-8b06e02d613f` | Cubre Manija Cromada Peugeot Partner/berlingo Mod Viejo (X4) | `DB-118` | ? |
| `84fa3576-e4df-467e-a871-56fd47d4fe0f` | Cubre Manija Cromada Porton Trasero Ecosport I | `CM-FO-1981` | ? |
| `08bc9b32-4c1e-4bdb-9fad-39ec927e8d11` | Cubre Manija Cromada Porton Trasero S10 2012/2016 | `JRMAN342` | ? |
| `8a205b6a-0575-481a-bdf9-9870bed7a37b` | Cubre Manija Cromada Porton Trasero Uno 01/... | `CM-FI-0513` | ? |
| `9186a2c6-8db6-4e4c-b2f7-5add6a8afbc4` | Cubre Manija Cromada Porton Trasero Uno.../00 | `CM-FI-0512` | ? |
| `4c71b6c5-053d-4c19-a283-dec84d897074` | Cubre Manija Cromada S10/blazer 1993/2011 4 Ptas | `CM-CH-6334` | ? |
| `b5ba94ed-0f79-4423-9b5f-166b59137ecd` | Cubre Manija Cromada Vectra/agile/aveo/captiva/cruze X2 | `JRM323P2` | ? |
| `76f7cacd-6693-4973-bb40-510e8e3569bf` | Cubre Manija Cromada Vw Virtus Polo Nuevo | `JRMAN364` | ? |
| `2c5f1a8d-dd39-482f-bbb1-f84daf971807` | Cubre Manija Cromada X 2 Vw Gol Saveiro Ii | `CM-VW-5387` | ? |
| `0ecaff74-29a8-4c9f-becf-6cd16cb5e894` | Cubre Manija Cromada X 4 Corsa 94/01 Vectra 96 Astra 98 | `DB-114` | ? |
| `2d58a6ee-217f-426f-9d60-9939dd6df6d5` | Cubre Manija Cromado Fiat Siena Palio X2 2005 / 2015 Delantera | `DB-112D` | ? |
| `a47d9b7d-4b3c-4e4f-8f51-67e5081d1cd7` | Cubre Manija Cromado Ford Fiesta Esosport I X 4 | `DB-002` | ? |
| `fad55620-74f1-457a-864c-cc318cae1a48` | Cubre Manija Cromado Gol Iii / Gol Iv X 2 Sin Agujero Cerradura | `DB-107T` | ? |
| `f555e3bf-b5ea-4a59-8df8-e11e08474a4f` | Cubre Manija Cromado Gol Iii / Iv / Saveiro X 2 Ptas | `CM-VW-5385` | ? |
| `9ce34616-c0f8-4055-87e8-c965ef6a7300` | Cubre Manija Cromado Honda Hrv X 4 2015/2022. | `CM-HO-7518` | ? |
| `99831d74-d57e-4f22-8b3f-70adffc0702c` | Cubre Manija Cromado Peugeot 307-c3 X2 | `DB-117/2` | ? |
| `52231a06-21b5-419e-9235-34bc2fb270d7` | Cubre Manija Cromado Peugeot 307-c3 X4 | `DB-117` | ? |
| `c0a9154c-56f0-412f-8ad0-b21de90d3695` | Cubre Manija Cromado Punto / Linea X4 | `CM-FI-0509` | ? |
| `b2443d1e-debf-4e68-855e-3d737da81959` | Cubre Manija Cromado Toyota Hilux 2016 -2019 4 Ptas | `CM-TO-7532` | ? |
| `29df0cc5-231f-4c64-9b65-2c9d4409d63d` | Cubre Manija Cromado X4 Chevrolet S10 2012/2016 -Aveo-agile-vectra-cruze 13-/15captiva X4 | `DB-120` | ? |
| `464ba313-5fd7-470c-bb63-c64ca54b7c37` | Cubre Manija Cromado X4 Ford Ranger 2012 - 2019 | `DB-127` | ? |
| `4b61c084-2ef5-495f-b395-b6c21e37b61e` | Cubre Manijas Cromadas Ford Fiesta Ecosport Kinetic / Fiesta Kinetic X4 | `DB-124` | ? |
| `d964e7b5-ed86-4fa5-9de4-7f2c632bca06` | Cubre Tapa Combustible Adhesiva (Varios Modelos) | `156` | ? |
| `9d81c42d-1d66-4fa4-8081-fe5be5c28bb4` | Cubre Tapa Combustible Cromada Clio I | `STO` | ? |
| `adf74fe8-db27-473a-81b4-738926045306` | Cubre Tapa Combustible Cromada Fun/ Celta (Todos)/celta | `CT-SZ-7387/0` | ? |
| `66646c0e-f320-4ed5-a43a-1298d0160591` | Cubre Tapa Combustible Cromada Palio/siena.../99 | `CT-FI-0454/0` | ? |
| `40276d88-47ff-4878-9150-7d7f8af49090` | Cubre Tapa Cromada Nafta Fiat Palio Viejo | `STG` | ? |
| `646c1519-6604-4be0-bf14-73bab699b6fc` | Cubre Valvula Calavera Cromada X4 | `VT-004` | ? |
| `d44643e9-77db-4bf4-9141-6f23cf8f784b` | Cubre Valvula Fluor X4 | `9499` | ? |
| `5ff722fc-675e-4ffa-8165-46bf3b291c5c` | Cubre Valvulas Plata X 4 | `6516` | ? |
| `9d820377-ade1-4275-9bf4-57746532632f` | Cubre Valvulas Sueltas | `VT-012` | ? |
| `84d32d9c-536d-4147-a3c0-4c60d381cf8a` | Cucharin Para Manija X4 Hilux 2012-2015 | `DB-192` | ? |
| `5aaba2bf-7787-4058-bf9f-1f9b9d4ab32b` | Espejo Exterior S-10 96/11 Manual Derecho | `5504/5D` | ? |
| `70596933-315f-4aa7-ae89-cc26c10e520d` | Espejo Interior Panoramico 27 Cm | `ES-017` | ? |
| `b4d0c5d8-71b9-4323-91a3-c964312a6b54` | Espejo Para Niño Colgar Y Sopapa | `ES-034` | ? |
| `29aa0e4d-3c5f-49f0-a07c-fdce722ca982` | Espejo Redondo Convexo 2" Adhesivo | `ES-011 - 3130` | ? |
| `33a33322-d4b1-42c5-8ae5-7c55c3eef699` | Espejo Redondo Convexo 3" Adhesivo | `ES-012 3131` | ? |
| `afcbd5e3-be55-4677-a3bd-5c9c634feb56` | Funda Afb Especifica Ford Ecosport Respaldo Repartido 1/3 Simil Cuero Negra | `AFB-ECOSPORT` | ? |
| `c289cd7f-f7a6-44ca-9b39-36641764b785` | Funda Afb Especifica Patagonica R.r.(country/cobalt)1/3 2/3 Simil Cuero | `AFB-PATAGONICA` | ? |
| `6f8e31dc-780d-4975-b8d8-ba1274656349` | Funda Afb Especifica Peugeot 504 Tela Color Negro | `AFB-504` | ? |
| `1869e2af-e064-4283-8ce3-58d03b4c09d4` | Funda Afb Especifica Vw Suran Resp Al Medio Con Logo S/ Cuero | `AFB-SURAN` | ? |
| `87f16e7f-fe25-446b-a306-4f1ca83b9705` | Funda Afb Especifica Vw Voyage Simil Cuero (Con Logo) | `AFB-VOYAGE` | ? |
| `91c9c404-6056-4475-9c3e-a1e4e9a44e34` | Funda Afb Universal Instalada Simil Cuero Economica Negro | `AFB-ECONOMICA N` | ? |
| `1189058f-7d80-40e0-9c84-78a6bb69c835` | Funda Afb Universal Simil Cuero (Con Logo) Citroen | `AFB-CITROEN` | ? |
| `80d03ca2-9a8e-42f6-a6ef-5984aae1d8c9` | Funda Afb Universal/especifica Fiat Uno 2011 Tela C/ Cuero | `AFB-UNO` | ? |
| `830e051d-5590-4078-a1b3-1dafe8221e81` | Funda Albocar Universal 100% Simil Cuero Gruesa Completa Tipo Original Negra | `FD-043N` | ? |
| `e6d33b64-0ec0-49a8-8315-728aa2267e70` | Funda Albocar Universal 100% Simil Cuero Gruesa Completa Tipo Original Negro C/ Rojo | `FD-043NR` | ? |
| `64838a46-f8f6-4be8-88ff-b27687da802e` | Funda Fiemo Especifica Ford Ranger 2008 Simil Cuero Cabina Doble | `FIEMO-RANGER` | ? |
| `05e18650-4986-41e4-8110-773d9a0edbab` | Funda Fitter 1/3 2/3 Universal Simil Cuero | `FITTER-UNIVERSAL` | ? |
| `da58c009-2bde-42a9-b617-8e1bcd80177f` | Funda Fitter Especifica Fiat Idea / Palio Weekend Simil Cuero | `FITTER-IDEA` | ? |
| `0667ea66-7081-44e5-948d-f5fd2009ec9e` | Funda Fitter Especifica Ford Ranger / Universal C/d "L"+2012 Simil Cuero | `FITTER-RANGERL` | ? |
| `52b0d228-d497-498b-a978-54e2ae86161f` | Funda Fitter Especifica Ford Ranger C/d Mod "K" 2005/2012 Simil Cuero Con Apoya Brazo | `FITTER-RANGERK` | ? |
| `4853204f-a55e-4896-b3cc-c26a91e20192` | Funda Fitter Especifica Pick Up 1/3 2/3 Simil Cuero Delantera | `FITTER-PICKUP` | ? |
| `b7361daf-f281-4d75-b872-aab464adf5d4` | Funda Fitter Universal Simil Cuero 2 Butacas Negro Con Rojo | `FITTER-2BUTACAS N` | ? |
| `0542b711-7516-4ec8-8b68-d1942d9a8fc1` | Funda Fitter Universal Simil Cuero Negra Con Rojo | `FITTER-UNIVERSAL N/RJ` | ? |
| `12eba3fe-028c-4062-aaf7-a5a23a3e11fa` | Funda Fitter Universal Simil Cuero Negra Con Rosa | `FITTER-UNIVERSAL N/RS` | ? |
| `0d628f13-d54f-42f1-b854-14dff7c52023` | Funda Good Year Universal Simil Cuero Negra Con Gris | `GY-4336` | ? |
| `44054fb7-6ac3-4805-af38-59d2d22ef299` | Funda Good Year Universal Tela Negra | `GY-2311` | ? |
| `03398fa3-5a34-4d5f-892f-9dbeb22a7a4e` | Funda Good Year Universal Tela Negra | `GY-2312` | ? |
| `fe056130-1bed-4a86-b535-9fee736d2537` | Funda Goog Year Universal Simil Cuero Negra Combinada Con Tela | `GY-4339` | ? |
| `2838b570-aee7-48aa-b6e7-29b2dd87ec86` | Funda Goog Year Universal Simil Cuero Negra Con Costura Gris | `GY-4335` | ? |
| `504ed794-4925-4b0c-ba7d-d6de98f44567` | Funda Goog Year Universal Simil Cuero Negra Con Gris | `GY-4331` | ? |
| `ebd98543-3f2d-4acc-9e96-586af29a3fa7` | Funda Ia Tuning Universal Instalada Simil Cuero Negra Con Franja Gris | `IA-UNIVERSAL N/G` | ? |
| `dec666c3-4b79-4bdd-829e-0b9baf4db339` | Funda Iael Universal Simil Cuero Negra Y Roja | `NA-043NR` | ? |
| `c5b7343a-7707-4818-addc-d4c0dcdc532c` | Funda Lyf Terciopelo Negro Juego X 10 Pzas | `SC-VELVET BK` | ? |
| `c181e61f-2831-4afd-839a-2083f701c394` | Fusible Tubular Vidrio 20mm (Mini Estabilizador) | `FUS20` | ? |
| `f4684ec6-d60c-4af3-ab38-a3a0cb85e255` | Glade Auto Sport Vidrio Repuesto | `REPGLADE` | ? |
| `c6d5d35f-13e4-40a7-b8b0-1b5d2b919eb9` | Jgo Cubre Espejo Cromado Cruze | `JRESP389` | ? |
| `849fccb0-3a91-4a0f-a8b2-c8d639efa4af` | Juego Cubre Espejo Cromado Agile 09/... | `CE-CH-6364` | ? |
| `0d81c499-7835-4fac-baac-69178c961780` | Juego Cubre Espejo Cromado Civic 07/12 Sin Guiño | `CE-HO-7466` | ? |
| `376801cb-e88a-4006-8d7a-894beef25a17` | Juego Cubre Espejo Cromado Corolla 2008/2014 Etios 2013/... Con Guiño | `CE-TO-7465` | ? |
| `6d4d5ba5-1ce9-4676-8e94-4eb2f88ad583` | Juego Cubre Espejo Cromado Corsa Ii 02-.../montana | `CE-CH-6321` | ? |
| `fca6682a-f971-4cf1-99ea-8a6624505bc9` | Juego Cubre Espejo Cromado Ecosport Kinetic +12 | `DB-159` | ? |
| `9decedfa-8e9d-4d01-9236-84521a10b237` | Juego Cubre Espejo Cromado Ecosport Kinetic 2013/... | `CE-FO-2144` | ? |
| `ccde7861-7346-4432-a17a-1d5be75e3e30` | Juego Cubre Espejo Cromado Fiat Punto / Linea / Fiat 500 | `CE-FI-0508` | ? |
| `9de17751-8ed4-404c-83a2-1526977ca15c` | Juego Cubre Espejo Cromado Fiat Uno Attractive Way | `JRESP357` | ? |
| `20b1ed73-3108-460e-a4eb-1d2ab2bd2d6c` | Juego Cubre Espejo Cromado Fiesta 02 / Max / Ka 08/... | `JRESP379` | ? |
| `ad30d026-911c-4856-91e0-64df7e663b01` | Juego Cubre Espejo Cromado Fiesta Kinetic 2010 - 2019 | `JRESP391` | ? |
| `ebbac19a-5d00-40c4-8d01-7a563a454d68` | Juego Cubre Espejo Cromado Ford Ranger 2013 -2022 Con Ranura Luz De Giro | `DB-158` | ? |
| `8382fcd7-7876-47d2-87b6-9d3457ae08a3` | Juego Cubre Espejo Cromado Gol Gi 88/94 | `CE-VW-5489` | ? |
| `690c8487-89b3-44fb-84d2-1ade29b85657` | Juego Cubre Espejo Cromado Gol Gii /Saveiro 95-99 | `JRESP377` | ? |
| `c74907ab-ec9c-4e59-8997-2b4b8af9f384` | Juego Cubre Espejo Cromado Meriva / Celta 07-... / Prisma | `CE-CH-6307` | ? |
| `bc516e55-72d5-4db7-b839-9b6e869c53c5` | Juego Cubre Espejo Cromado Palio/siena 00-04/uno Fire 06-... | `CE-FI-0493` | ? |
| `1800c8cf-df5c-40a5-821c-d34af09e1183` | Juego Cubre Espejo Cromado Palio/siena 04-10 | `CE-FI-0451` | ? |
| `7e90c933-bf8b-4b3b-92f4-ce05b5d9d3d6` | Juego Cubre Espejo Cromado Palio/siena 96-99/uno Fire 01-05 Derecho | `CE-FI-0492` | ? |
| `c6a4ef06-191a-46d8-a89c-0dda5f4f716a` | Juego Cubre Espejo Cromado Peugeot Partner - Berlingo | `DB-163` | ? |
| `f373c23d-95fe-47e3-8b1a-beac94aa4c1b` | Juego Cubre Espejo Cromado Ranger 2013/2022 | `CE-FO-2173` | ? |
| `c4b8257d-c9b1-4dec-b8fc-8a503bc17f96` | Juego Cubre Espejo Cromado Strada / Palio Weekend / Idea Adventure 08/... | `JRESP382` | ? |
| `649f3be0-c0ec-41eb-8471-32c652e24271` | Juego Cubre Espejo Cromado Susuki Fun/ Celta | `CE-SZ-7386` | ? |
| `273aab5d-7402-454f-b36a-4b16d2c599a4` | Juego Faros Traseros Peugeot 206 04/11 | `SK3700` | ? |
| `d9420190-8a5d-4052-86a2-768579de8676` | Kit Faro Auliar Fox 10/15 Con Rejilla | `12340/50` | ? |
| `0bb5f3ad-e668-4f57-b289-a3c7638b629e` | Kit Faro Auxiliar Suran 10/15 Con Rejilla Y Vira Cromada | `12340/60` | ? |
| `c81e04bf-4bfe-445d-985e-4807f2c89766` | Kit Faro Auxiliares Kangoo 08/12 Con Rejilla | `4325/11` | ? |
| `0a4446d1-8f86-48df-b53d-458cd34d4f58` | Kit Faros Auxiliares Vw Voyage 09/12 Saveiro 10/13 Gol Trend 08/12 Con Rejilla | `12340/12` | ? |
| `02cd0821-f5a9-4cab-8f6e-5aad9b9b915a` | Led T20 1 Polo Blanco Vidrio Cambus (Par) | `6175` | ? |
| `90122c78-2b33-4f88-a25e-5aabf5a65b77` | Led T20 1 Polo Naranja Vidrio Cambus (Par) | `6174` | ? |
| `ab9a345c-3ccb-4528-96a5-607f6e27b83b` | Led T20 1 Polos Rojo Vidrio Cambus (Par) | `6176` | ? |
| `b9468e0e-b480-43a3-be36-2a6f0c80f71f` | Led T20 2 Polos Rojo Vidrio Cambus (Par) | `6181` | ? |
| `b624635b-4f52-4e9e-a556-f65c191d115f` | Led T20 2 Polos Rojo Vidrio Cambus Juego | `6183` | ? |
| `418437d7-1b4b-4490-99d5-84aa9924e30e` | Marco Faros Traseros Cromado Gol Trend X2 | `JRFAR704` | ? |
| `79b129e9-f9a4-4e59-b6e0-f58d0cfd2b38` | Mascara De Faro Trasero Hilux X2 2016 - 2021 | `DB-173T` | ? |
| `d6cd2690-2594-4400-870b-7ed829ae8dc3` | Optica Fiat Strada 03/05 Siena 01/07 Palio 01/07 Derecha | `6333/5D` | ? |
| `920ad390-b3df-4fb1-bd7c-f4bacfda660b` | Optica Fiat Strada 03/05 Siena 01/07 Palio 01/07 Izquierda | `6333/5I` | ? |
| `383144cb-672d-4375-b738-b5a81fca35a4` | Optica Vw Gol Power 2006/2014 | `6241/D` | ? |
| `b54a155d-5de2-470a-85ef-5981d1d1cfbd` | Parrilla Porta Equipaje Fast Rack Universal 1.45 X 1.65 Mts Sprinter Transit Trafic Mb 180 | `11020C` | ? |
| `b1b247ab-66db-46c1-884d-a4ce2c7e3ec1` | Parrilla Porta Equipaje Fast Rack Universal Boxer Ducato 1.35 X 1.65 Mts | `11018` | ? |
| `10bc6b27-96fb-43b5-9d8c-51eca4d86490` | Parrilla Porta Equipaje Fast Rack Universal Partner Berlingo 1 X 1.65mts | `11008` | ? |
| `caff1ed5-541f-49be-9dfa-fe533b632dff` | Parrilla Porta Equipaje Partner - Berlingo | `PEPE01` | ? |
| `44f22bc3-b39d-4177-bf3d-9d43b0b86d24` | Parrilla Portaequipaje De Aluminio Tipo Canasto Reforado 130 X 100 X 16 Cm | `JB-005` | ? |
| `d3888088-08d3-4685-b954-5c460002a67a` | Protector De Paragolpe Cromado X 4pzas | `PP-013` | ? |
| `4440ed08-ef2b-42a1-bb8b-3f6cf19bceda` | Protector De Paragolpe Iael Gris | `PP-010` | ? |
| `6319178c-d49d-4466-a6ce-266551667041` | Protector De Paragolpes X4 Negro O Gris | `PP-004` | ? |
| `fd7e9e2b-4e06-4d40-8d3b-2d4b59c03cf9` | Protector De Puerta / Paragolpe | `PR-021T` | ? |
| `ab1dd3da-7ae9-4741-91d8-4598f34aad94` | Protector De Puerta / Paragolpe Gris | `PR-020G` | ? |
| `77c2b910-f95c-4480-aa1e-7a40c8682094` | Protector De Puerta 4 Piezas Rojo | `PPT-110RD` | ? |
| `ee4bec86-f1af-4b30-b327-caf86e67dbb7` | Protector De Puerta Con Ojo De Gato Iael Azul | `PR-001AZ` | ? |
| `644a6a82-1456-402a-8860-81288f275dce` | Protector De Puerta Con Ojo De Gato Iael Rojo | `PR-001R` | ? |
| `39ebefb4-b1b0-40c7-8db5-9583214982f0` | Protector De Puerta Con Ojo De Gato P/encastrar Iael Ambar | `PR-001AM` | ? |
| `ce5080d8-98b7-4d0a-b8dd-7ea298b33055` | Protector De Puerta Con Ojo De Gato P/encastrar Iael Blanco | `PR-001B` | ? |
| `bd75a044-dc23-4fb6-b511-8425db27d4d2` | Protector De Puerta P/adherir Con Centro Cromado Iael | `PR-012 - BG212` | ? |
| `f95e68dc-6dc0-4795-9f36-ebf2ba746795` | Protector De Puerta P/adherir Transparente R Sports | `PR-007` | ? |
| `9e24403b-6761-482e-8fdd-9d579024e402` | Protector De Puerta Plata Y Azul Por 4 Piezas | `PPT-7046SB` | ? |
| `3087d49e-6649-402d-8d0d-cc1bda327fc9` | Protector De Puerta Transp 69 Cm Encastre X 4 | `PR-023T` | ? |
| `7054ffe0-7463-441b-a5a5-6ca6adc56485` | Protector De Puerta Transp Encastre X 4 | `PR-024T` | ? |
| `6dde0557-8f38-4e86-a3b8-b265b7816eb8` | Rejilla De Faro Auxiliar Gol Trend Voyage 12-16 (Par) | `12351` | ? |
| `a7992f07-f939-4d73-bf7f-f66b3cd7f0e8` | Set De Luces Parrillas Estilo Raptor Instalado | `DJ-KD138810W` | ? |
| `f98bdba5-5bd1-447d-9ac2-3053bee532f1` | Vidrio De Faro Auxiliar Gol 06/14 Suran 06/10 Fox 04/10 | `12303/5` | ? |
| `dff08dc5-22f5-409f-b545-3a02e0d31236` | Vidrio Optica Mercedes Benz 180 93/96 Derecho | `6515/1D` | ? |
| `5f23eea9-e6da-49ec-9944-9668cc513bdd` | Vidrio Optica Mercedes Benz 180 93/96 Izquierdo | `6515/1I` | ? |
| `eff9f8e9-6d40-431d-a422-1df8b74ae252` | Walker Vidrio Repuesto - Auto Sport | `SPORTREPW` | ? |
| `3e75c1d9-32a7-477c-9fa6-9c0ff92a9868` | Y Griega Tipo Usadas | `18291` | ? |

| **SQL — Renombrar productos** |
|---|---|
_No se requieren renombres en esta categoría._

---

### 12. Eléctrico

**SQL — Crear categoría:**
```sql
INSERT INTO category (id, name, description, color, "sortOrder", "isActive")
VALUES ('cat-electrico', 'Eléctrico', 'Cargadores USB, fusibles, conectores eléctricos, cables de batería, relays, botones pulsadores, transformadores', '#A855F7', 12, true);
```

**SQL — Asignar productos a esta categoría:**
```sql
UPDATE product SET "categoryId" = 'cat-electrico' WHERE id IN (
  'prod-1781102172636-9lls2y5og',
  '6ef5712b-8556-4cc7-aff3-6978949d48fb',
  '2df02a4e-f082-458c-a082-7436b6f1fdde',
  '4b00ae17-347f-42a7-b749-14afc902799c',
  'fded5a76-1762-48c9-9f9a-86fb4d491c5a',
  '1868427e-c347-483b-bd59-ab30beeed39d',
  '2a6cd616-efb8-4c7e-952f-b88830df704f',
  '5be592a2-f4a3-48a1-8a77-e23e9cfdb49e',
  '224f3a9e-8620-4880-b47a-dae8d6d5d757',
  'cdfc5775-9cd7-4bd1-a4e5-3eef778fdfaa',
  '2cc2fd85-44d5-4f38-bcbe-10b320121ac3',
  '93dae738-63c3-4942-aa5c-8c8572cf7f32',
  '41b3eba3-05f9-49f3-abea-f465644fc473',
  '16520479-8b66-48d4-a7c0-00cbe0fad3d0',
  '11b5211a-d330-4ee9-ac58-49b977894b26',
  'ad2290b9-8d21-4b1e-b0f3-9d7b4422d0fa',
  'ebcd09c0-8199-4fd3-b6c2-f09260c8e7fa',
  '3fc00138-89d1-46b0-a509-062cf7984afd',
  '0d237fc6-4eee-4182-9754-e82a8a717f40',
  '3ab98501-f6f8-45ae-a35d-5695471547fb',
  'f533e952-211d-445e-afcf-69fb21b27792',
  'c3af3307-929d-4a7a-8081-6d1df996de91',
  '627c1cc4-88ed-4bd8-8deb-1bf61bdf46c7',
  '668b0f0c-79f5-4901-bb76-611d8d84955e',
  'f819112e-37ac-4ce2-98ed-ffbecec73360',
  'a5bd5876-a300-43b1-91ff-8dfc82da3a3a',
  '2421e1c4-fad4-405a-9a97-e652a8717063',
  'bd35b4a3-7c40-43de-989c-34f65f7ca34a',
  '760a5b45-2de9-415c-bb05-86aa34ad0a42',
  '386644eb-c317-4288-a355-8aeb14f7dafe',
  'a9f6fc30-4187-4ed4-b052-e5649c2942d1',
  'ac831c75-e3a8-4390-9423-9e438a16d892',
  '804a1334-0c29-4b14-b67d-eef85e253c0c',
  '3f461fcb-80eb-4b94-9736-4cfe1b6a03e9',
  '586501fc-33bb-4e90-8e2f-a1ee31066e8f',
  '67e4dc48-5dc0-4eea-9eaa-ab80cd237c43',
  '1ba5ebb4-a286-4a50-b8ba-fab2b64ccce2',
  '0188e03a-fed4-42d1-b692-328ffa4059a0',
  '962d1216-898b-41e3-9b58-705a7b424dc7',
  '19996110-2675-487f-aaa0-4ce0a616de02',
  '6d6ffcb9-243b-427f-8f0c-b9e39f903c7b',
  '95b67947-a4db-4fed-9fbd-2fa7fbfd2c97',
  '51fe4e2d-d57f-487c-8b32-3ac47504a17f',
  '0c968764-d90c-42fb-b3c4-540e88680c8a',
  '58be7715-40ba-4779-b87c-164a454dd2df',
  '836cd348-d606-4caa-ac67-12880de7b51f',
  'e567b3a8-9f82-491a-bd4c-8006b29ba5f2',
  'f591a412-d86b-4944-ab58-5fd02be4d45d',
  '08a6f89b-8135-4b5d-adc7-d991a21d17dc',
  '28e1714f-f54e-4e90-a6a4-41d6e235ef6a',
  '9eb92241-0229-4695-b52c-9c698fdaff06',
  '96910968-f340-4043-bf34-150614d26789',
  '9103f30f-5f4f-4746-91c7-ef6dba7cafc9',
  'c4a7c989-a608-49b9-9024-49b0224e001d',
  '8168042e-7136-498e-852d-bc4e42b395a3',
  'cda3bc22-e51a-48f9-a6e2-d64fbfa7db98',
  '8389c854-7207-4a9c-b4a9-b616cd64fd29',
  '1c38c4ca-80ff-4136-8470-0de6c24e67e5',
  '67310492-ab15-4785-b028-e5ed500df25a',
  '64a5377c-8464-4f9d-8b2e-bae36dff6bcf',
  '6b1006b1-8d90-475c-aaee-895528490bfc',
  '44329a01-3ea3-44ee-bbfc-e2aac1086700',
  '86d74973-18df-4577-8b5f-a3fd05ed1905',
  '89c1ed1e-5bbf-4f0b-9749-89c547217149',
  '499f3e0a-6deb-4839-8ee3-7b15cd867156',
  '09cc2b6f-8d49-49f4-bb3e-e56c1b03bda6',
  '2222b326-fc53-4c10-8669-f2ce17094134',
  '705361dc-75e5-4a11-a036-c1082b235dad',
  '1f56ab0d-9321-49af-b96c-4f3abc076479',
  '8f7b1884-30e4-45d5-9e1c-8bb4aca6a0a0',
  '692559fa-78ce-4b1c-9559-b6556649b6ca',
  '56bc6dea-fbae-44ad-82e1-c38a2d98314f',
  '31f9c9bc-c20f-47c3-ad33-ff10b9da41d1',
  '2648c088-7a90-4e39-901e-d6fd3555550f',
  'de97e72b-e331-4b93-a373-4e054b634d1a'
);
```

**Productos (75):**

| ID | Nombre actual | SKU | Stock | Sugerencia |
|---|---|---|---|---|
| `prod-1781102172636-9lls2y5og` | ARANDELAS ALUMINIO X 10 | `6790` | ? | ⚠️ → "Arandelas Aluminio X 10" *(ALL CAPS name)* |
| `6ef5712b-8556-4cc7-aff3-6978949d48fb` | Boton Pulsador Redondo Metalico | `PBS-28B` | ? | |
| `2df02a4e-f082-458c-a082-7436b6f1fdde` | Boton Pulsador Redondo Rojo | `PBS-20` | ? | |
| `4b00ae17-347f-42a7-b749-14afc902799c` | Cable Alargue Usb 2 Mts | `USB-AMAH-2.0` | ? | |
| `fded5a76-1762-48c9-9f9a-86fb4d491c5a` | Cable Puente Bateria 120 Amp | `ABC-120` | ? | |
| `1868427e-c347-483b-bd59-ab30beeed39d` | Cable Usb-mini Usb 1.8mts P/ Cel | `NM-C68` | ? | |
| `2a6cd616-efb8-4c7e-952f-b88830df704f` | Cargador Usb Dinax 3.1amp Tipo C | `DX-AUT-3.1-TC` | ? | |
| `5be592a2-f4a3-48a1-8a77-e23e9cfdb49e` | Clip Bateria 100 Amp | `CLBAT100` | ? | |
| `224f3a9e-8620-4880-b47a-dae8d6d5d757` | Encendedor De Auto Completo C/luz | `EN-001` | ? | |
| `cdfc5775-9cd7-4bd1-a4e5-3eef778fdfaa` | Encendedor De Auto Macho | `DIV 10010` | ? | |
| `2cc2fd85-44d5-4f38-bcbe-10b320121ac3` | Encendedor Macho 12v Tipo Europeo | `EN-004` | ? | |
| `93dae738-63c3-4942-aa5c-8c8572cf7f32` | Ficha 1m Rca/2h Rca | `AU9` | ? | |
| `41b3eba3-05f9-49f3-abea-f465644fc473` | Ficha 2 X 8 Contactos Strong - Cada Una | `ST-167` | ? | |
| `16520479-8b66-48d4-a7c0-00cbe0fad3d0` | Ficha 20 Vias Stereo | `ST-282` | ? | |
| `11b5211a-d330-4ee9-ac58-49b977894b26` | Ficha Adaptador 6.5 St/2hembra Rca | `AU5` | ? | |
| `ad2290b9-8d21-4b1e-b0f3-9d7b4422d0fa` | Ficha Adaptador 6.5st/hembra Rca | `AU80` | ? | |
| `ebcd09c0-8199-4fd3-b6c2-f09260c8e7fa` | Ficha Adaptador Macho Rca/macho Rca | `M/MRCA` | ? | |
| `3fc00138-89d1-46b0-a509-062cf7984afd` | Ficha Adaptador Plug A 2 Hembras 6.5 Mm | `AU13` | ? | |
| `0d237fc6-4eee-4182-9754-e82a8a717f40` | Ficha Akita | `CI-37` | ? | |
| `3ab98501-f6f8-45ae-a35d-5695471547fb` | Ficha Boss 12 Pines | `ST-284` | ? | |
| `f533e952-211d-445e-afcf-69fb21b27792` | Ficha Ford Fuente 1 | `ST-289` | ? | |
| `c3af3307-929d-4a7a-8081-6d1df996de91` | Ficha Iso + Toyota Hembra | `AD-TOY4` | ? | |
| `627c1cc4-88ed-4bd8-8deb-1bf61bdf46c7` | Ficha Lg | `CI-28` | ? | |
| `668b0f0c-79f5-4901-bb76-611d8d84955e` | Ficha Original Ford Fuente | `ST-289-2` | ? | |
| `f819112e-37ac-4ce2-98ed-ffbecec73360` | Ficha Original Honda - Isuzu | `CI-29` | ? | |
| `a5bd5876-a300-43b1-91ff-8dfc82da3a3a` | Ficha Original Toyota + Iso | `V704` | ? | |
| `2421e1c4-fad4-405a-9a97-e652a8717063` | Ficha Original Toyota Juego | `CI-30` | ? | |
| `bd35b4a3-7c40-43de-989c-34f65f7ca34a` | Ficha Peugeot Pioneer | `ST-168` | ? | |
| `760a5b45-2de9-415c-bb05-86aa34ad0a42` | Ficha Peugeot Pioneer 3 F16vph3 | `ST-168-2` | ? | |
| `386644eb-c317-4288-a355-8aeb14f7dafe` | Ficha Plug 3.5mm Mono Plug | `3.5 MN` | ? | |
| `a9f6fc30-4187-4ed4-b052-e5649c2942d1` | Ficha Plug 6.5 Stereo Metalico P/ Soldar | `6.5ST-MET` | ? | |
| `ac831c75-e3a8-4390-9423-9e438a16d892` | Ficha Plug Banana Con Tornillo | `BAN/T` | ? | |
| `804a1334-0c29-4b14-b67d-eef85e253c0c` | Ficha Plug Plastico 2.5mm | `2.50MN` | ? | |
| `3f461fcb-80eb-4b94-9736-4cfe1b6a03e9` | Ficha Rca 2m A 1h | `AU11` | ? | |
| `586501fc-33bb-4e90-8e2f-a1ee31066e8f` | Ficha Rca Hembra Metalica P/ Soldar | `H/RCA/METALICA` | ? | |
| `67e4dc48-5dc0-4eea-9eaa-ab80cd237c43` | Ficha Sony 16 Pines | `CI-67` | ? | |
| `1ba5ebb4-a286-4a50-b8ba-fab2b64ccce2` | Ficha Sony 16 Pines | `CI-68` | ? | |
| `0188e03a-fed4-42d1-b692-328ffa4059a0` | Ficha Sony Nuevo | `ST-280` | ? | |
| `962d1216-898b-41e3-9b58-705a7b424dc7` | Ficha Targa B-52 Positron 14 Vias | `ST-285` | ? | |
| `19996110-2675-487f-aaa0-4ce0a616de02` | Ficha Tipo Akita | `ST-281` | ? | |
| `6d6ffcb9-243b-427f-8f0c-b9e39f903c7b` | Ficha Tipo Panasonic 101u | `ST-278` | ? | |
| `95b67947-a4db-4fed-9fbd-2fa7fbfd2c97` | Ficha Tipo Panasonic 103u | `ST-277` | ? | |
| `51fe4e2d-d57f-487c-8b32-3ac47504a17f` | Fusible Afc | `AFC` | ? | |
| `0c968764-d90c-42fb-b3c4-540e88680c8a` | Fusible Agu 40/60/80 Amp | `KTB-049` | ? | |
| `58be7715-40ba-4779-b87c-164a454dd2df` | Fusible Anl 100a/150a/200a/300a | `KTB-048` | ? | |
| `836cd348-d606-4caa-ac67-12880de7b51f` | Fusible Ficha Mini Sueltos Colores Varios 5amp 7.5amp 10amp 20amp 25amp 30amp 40amp | `T101S` | ? | |
| `e567b3a8-9f82-491a-bd4c-8006b29ba5f2` | Fusible Mini Pal Muela | `PALMINI` | ? | |
| `f591a412-d86b-4944-ab58-5fd02be4d45d` | Fusible Pal Hembra | `PAL HEMBRA` | ? | |
| `08a6f89b-8135-4b5d-adc7-d991a21d17dc` | Fusiblera Afc Con Fusible Ktb-042 | `ST-192` | ? | |
| `28e1714f-f54e-4e90-a6a4-41d6e235ef6a` | Fusiblera Agu Doble Bigger | `V-190` | ? | |
| `9eb92241-0229-4695-b52c-9c698fdaff06` | Fusiblera Agu Strong O Blauline Simple Ktb-024 | `ST-189` | ? | |
| `96910968-f340-4043-bf34-150614d26789` | Fusiblera Anl Con Fusible Anl-03 | `ANL-03` | ? | |
| `9103f30f-5f4f-4746-91c7-ef6dba7cafc9` | Fusiblera Anl Premiun | `ST-194` | ? | |
| `c4a7c989-a608-49b9-9024-49b0224e001d` | Fusiblera Anl Strong Ktb-106 | `ST-196` | ? | |
| `8168042e-7136-498e-852d-bc4e42b395a3` | Hembra Para Encendedor Con Tapa De Goma | `EN-007` | ? | |
| `cda3bc22-e51a-48f9-a6e2-d64fbfa7db98` | Interruptor Boton Cambio De Luces | `1045` | ? | |
| `8389c854-7207-4a9c-b4a9-b616cd64fd29` | Interruptor Llave Un Punto | `ELL615` | ? | |
| `1c38c4ca-80ff-4136-8470-0de6c24e67e5` | Interruptor Llave Un Punto Blanco | `PBS-17A` | ? | |
| `67310492-ab15-4785-b028-e5ed500df25a` | Interruptor Llave Un Punto Metalica 10a On Off | `ELL890` | ? | |
| `64a5377c-8464-4f9d-8b2e-bae36dff6bcf` | Interruptor Llave Un Punto On-off | `ELL616` | ? | |
| `6b1006b1-8d90-475c-aaee-895528490bfc` | Interruptor Llave Un Punto Palanca Roja O Azul | `EC2512` | ? | |
| `44329a01-3ea3-44ee-bbfc-e2aac1086700` | Interruptor Llave Un Punto Para Tirar | `ELL460/1` | ? | |
| `86d74973-18df-4577-8b5f-a3fd05ed1905` | Interruptor Llave Un Punto Rectangular Con Luz | `ELL614` | ? | |
| `89c1ed1e-5bbf-4f0b-9749-89c547217149` | Interruptor Llave Un Punto Redonda Azul | `ST-INT83BL` | ? | |
| `499f3e0a-6deb-4839-8ee3-7b15cd867156` | Interruptor Llave Un Punto Redonda Roja | `ST-INT82RD` | ? | |
| `09cc2b6f-8d49-49f4-bb3e-e56c1b03bda6` | Interruptor Luces Auxiliares | `AP-18` | ? | |
| `2222b326-fc53-4c10-8669-f2ce17094134` | Interruptor Palanca Larga | `ELL800` | ? | |
| `705361dc-75e5-4a11-a036-c1082b235dad` | Interruptor Pulsador Tipo Auxiliar | `5369` | ? | |
| `1f56ab0d-9321-49af-b96c-4f3abc076479` | Terminal Ojal 10.5x18 | `V213` | ? | |
| `8f7b1884-30e4-45d5-9e1c-8bb4aca6a0a0` | Terminal Ojal 18x13 | `V211` | ? | |
| `692559fa-78ce-4b1c-9559-b6556649b6ca` | Terminal Ojal 6.3x9.7 Cable Grueso | `V212` | ? | |
| `56bc6dea-fbae-44ad-82e1-c38a2d98314f` | Terminal Ojal 8x13.5 Cable Fino | `V214` | ? | |
| `31f9c9bc-c20f-47c3-ad33-ff10b9da41d1` | Terminal Pala Hembra 3.8 | `V209` | ? | |
| `2648c088-7a90-4e39-901e-d6fd3555550f` | Terminal Pala Hembra 7.5 | `V208` | ? | |
| `de97e72b-e331-4b93-a373-4e054b634d1a` | Terminal Pala U Tipo Y Griega | `V210` | ? | |

| **SQL — Renombrar productos** |
|---|---|
```sql
UPDATE product SET name = 'Arandelas Aluminio X 10' WHERE id = 'prod-1781102172636-9lls2y5og';
```

---

### 13. Herramientas y Mantenimiento

**SQL — Crear categoría:**
```sql
INSERT INTO category (id, name, description, color, "sortOrder", "isActive")
VALUES ('cat-herramientas', 'Herramientas y Mantenimiento', 'Herramientas, líquidos y fluidos, lubricantes, pegamentos y adhesivos, pilas, butacón', '#78716C', 13, true);
```

**SQL — Asignar productos a esta categoría:**
```sql
UPDATE product SET "categoryId" = 'cat-herramientas' WHERE id IN (
  '4c966d49-f370-4705-92a0-4cd6b68a408a',
  'ff1bcf31-a8d0-4d09-9483-448921056e31',
  'prod-1782569581743-vtd0687lu',
  'a955719e-3d13-44c4-bccb-37d5384af1c3',
  '298c8c2d-4eed-420b-bf5f-8c95be265ba9',
  '656805d8-f695-4696-8784-c09efe6bf150',
  '936ecf12-dd7f-4e98-b5b3-9ece54789439',
  '289ea6df-8976-41bd-a3ad-10b4dc99c863',
  'b01f7fde-f91f-48f6-8f82-ee2b246c6d93',
  '93820ced-00f2-4237-a2b8-437b7fb90632',
  '4d8099d2-4be7-416a-9573-360518095d19',
  '7db0e5b7-4679-4608-b189-4fb1d71464fa',
  'ff0f1139-9274-4daa-a276-c03e6c782e9b',
  '8ec2efd4-58d6-4cbb-a607-2e3bf83b3ffa',
  'a369f57d-3074-4b82-b51b-2d50e55c603d',
  '61dcf94a-8c27-43db-990c-d1138f31aeec',
  '4c2693ac-20e9-48b7-9496-16a5356f20e5',
  '322a8e14-ad36-40e5-8d8d-4a00c66ed2c6',
  '60079d48-25d1-4df7-9ba3-d39a2735a454',
  '48501964-bfc9-4f07-ab02-68524decfb0b',
  'b590f56a-436e-4cf9-8e48-59d8e2290821',
  '48cf3427-d4e1-4219-8038-863191eb3111',
  'de74bd6d-70f2-4f5a-99f8-1683367709b0',
  'bea06b6e-604c-420e-968b-79c3ff582f2b',
  'a26778aa-1e7b-4ec8-8365-d1629b5a8c17',
  'ff008bef-46c7-4045-b33d-58f4b04074d3',
  '79698962-4002-4a93-902c-63855671ef26',
  '05eeda53-9764-4d5f-9f42-d0f4961297e4',
  'e95b8edb-cf70-49a3-9d4d-aeedb5cca0ec',
  '570e650e-d1a8-42fa-b9e9-9989694cd861',
  '7af56576-a9b6-421f-bb54-567ea31e5483',
  'b057df3c-8f3b-4474-8ebd-94d632ca134b',
  'f08db3e2-cea9-4bb2-ae8b-51515eea9676',
  '43d5d643-abce-4fd4-bfa8-0e221f36ed6d',
  'b08afbf2-92ab-45f4-85e2-125c4df3f9cc',
  '087e7b18-2d34-4dc0-b131-1f5ee3f34238',
  '8be22d6c-5188-4508-84c1-4228e9225de5',
  '51b1c88b-631e-457a-bd78-ad4dcb22b9bd',
  '8b5bd630-ea07-483d-9f63-df25376a30fa',
  '38a2c8e9-affe-480e-8535-28fd4730d3fb',
  'b8b2c896-c33b-4c1a-8d51-670165257a53',
  '2b81d621-ca9b-4dbe-bb98-52dd57dcc2f1',
  '5bcb5214-9b33-4d98-b37c-9455131f6495',
  'f56660e6-cd34-4608-a10c-db9e622cff2d',
  '268e4e54-2d80-48e2-945a-17e18aeaea37',
  'b1bdd99e-853e-4ca6-ae49-6b36595e89df',
  'edbf4f44-ed88-48b4-9c86-df31066d38b0',
  'c098f767-26b0-49c6-adfd-31f1516bd6a8',
  'prod-1778781897626-eycn5xouj',
  '28a351ac-af30-499e-96cb-837aa4ed9522',
  '0c230a02-6ed0-445f-aa60-a55f8b4c4e62',
  '10e1d85e-0824-4e03-8411-f19b02831c02',
  '39aa1075-8a9e-4ba7-8177-668cf51a01f3',
  '7ef616b4-277d-4adb-a9a5-e534aa084d18',
  '14da6d5d-49d7-4a0f-b8ba-df19f73208d7',
  '76b77e48-d42c-4f50-a68d-e4062e31e28b',
  'a858240d-dcd6-4a89-b7b0-bcb37b474b45',
  'e6fbc728-f0cf-4f33-bbf2-7524aa3f45a0',
  'bf3cc031-2f6c-4ab0-9a17-2814cf28f989',
  '756cc866-98da-465d-b98f-5ab4fbe7915c',
  '235f7358-2e07-4cbe-a6ba-6b5cd3749ae8',
  'prod-1779983000377-a0o0zku0j',
  'prod-1779982932142-rtnutyoal',
  '551777c4-217a-4924-acbc-5fdf28853941',
  '3b626f22-3b97-4597-a032-1fcd14de0cc8',
  '10a03c41-a639-4bce-bd7f-1d23f88a30a9',
  '5f4f9659-b559-49a7-8c35-bba261450a4d',
  '3dd1d93d-8a3a-4a99-9ecf-4f593eb2417e',
  '6a081770-0052-4c6a-8fef-f5045e186254',
  '813b1e4c-f860-4f45-90f8-3091fa725c10',
  '80f4d3f3-3ff5-4123-9445-bc46c6861ff3',
  'prod-1779815962679-vrf3pf44b',
  '92341083-b7ae-44de-9896-bfc0c53bf326',
  '93fc77e9-133d-4aa1-ad25-6e7f126d7033',
  '383c7ee5-0c18-495f-be75-61f46e673657',
  'ab93ce74-3b1a-4ea6-a73a-3774ebd371bb',
  'd887743c-a687-457c-b433-6690d66e3883',
  '47aeb748-44b9-4aad-b467-dcc022c0a6c4',
  'ac37a369-7920-419a-ad06-075e511b948a',
  '9733a22c-4bd1-4152-b989-a819be6bd468',
  '55d1e331-4359-4243-af72-3c356877fd57',
  '08980f0e-b267-4809-858e-310f41616392',
  'b654e491-f9b7-4e5b-a5bf-dae0cf15f3ac',
  'b28c7ba8-5f46-4394-87e1-7dcd97385db9',
  'df4f392e-6426-41a2-97f6-6c8f0215e1b8',
  'ad83b06a-edf7-4613-a00f-264bb6a99aa0',
  '78278c03-0b36-489c-b467-40f41076cfb0',
  'ed3ae9f1-adda-4f6c-88d7-07a91b0ad19c',
  '7a4497e0-dd9c-4b07-ba75-db626fcf836c',
  'faa92c1e-30e0-4bce-b677-e83aa7e9a632',
  '6cec0726-f396-41ed-9970-5d80a910d77f',
  'c4e3770a-c5c3-4ee7-9178-17161d794a9d',
  'ae7f2ebb-28cd-416e-8606-665056bc6b79',
  'f64f32a7-0de3-43db-9a4d-b7054f50dc66',
  '68b1b779-0a92-4756-ae50-298e8640ed8c',
  '63383bf5-9795-4b7d-88d4-39e9dc8cc162',
  'e092bcfb-0aa0-48c5-8c9f-9f991e060ea8',
  'prod-1783516069615-or93j0ke2',
  '53846e78-998f-48b2-9068-8cd91f514e68',
  'd181fed5-8d5d-44f6-88e5-7b75bf920dbd',
  'b46b4bfb-30c1-4ee7-b5d2-247c59925694',
  '3bb19cc9-d6ef-4fe5-b77a-548c9e14b67e',
  'adeafaa6-2896-408a-9480-e237f0e98c24',
  '286e4ffb-6ae9-41c7-8a55-9d3f7edf5b50',
  'd3d7a676-6eeb-4d71-bd23-73c89ab15e1a',
  '426ad88d-bc0c-42d4-80fe-4f39b84e67c1',
  '50e6f9c1-5361-4bef-97d0-7b0ae62478b3',
  '639b9363-32f6-487a-baa2-309f5c460f37',
  '62eb0b1a-0563-442d-89f9-0155bdbd4bf1'
);
```

**Productos (109):**

| ID | Nombre actual | SKU | Stock | Sugerencia |
|---|---|---|---|---|
| `4c966d49-f370-4705-92a0-4cd6b68a408a` | Agua Desmineralizada 5 Lts | `AGUA` | ? | |
| `ff1bcf31-a8d0-4d09-9483-448921056e31` | Butacon Cabina Simple | `BUTACON` | ? | |
| `prod-1782569581743-vtd0687lu` | CEPILLO TALADRO KIT X 3 | `9874` | ? | ⚠️ → "Cepillo Taladro KIT X 3" *(ALL CAPS name)* |
| `a955719e-3d13-44c4-bccb-37d5384af1c3` | Filtro De Aire Deportivo Biconico 63mm | `FA002 FA017 FA001` | ? | |
| `298c8c2d-4eed-420b-bf5f-8c95be265ba9` | Filtro De Aire Deportivo Biconico 76mm | `FI-001` | ? | |
| `656805d8-f695-4696-8784-c09efe6bf150` | Funda Silicona 3 Botones Llave Crv Civic | `HONDA05` | ? | |
| `936ecf12-dd7f-4e98-b5b3-9ece54789439` | Funda Silicona 3 Botones Llave Fit City Civic | `HONDA04` | ? | |
| `289ea6df-8976-41bd-a3ad-10b4dc99c863` | Funda Silicona Llave Honda Crv Hrv | `HONDA03` | ? | |
| `b01f7fde-f91f-48f6-8f82-ee2b246c6d93` | Funda Silicona Llaves 206 207 307 Partner | `PEUGEOT04` | ? | |
| `93820ced-00f2-4237-a2b8-437b7fb90632` | Funda Silicona Llaves 207 3008 | `PEUGEOT01` | ? | |
| `4d8099d2-4be7-416a-9573-360518095d19` | Funda Silicona Llaves 208 | `PEUGEOT03` | ? | |
| `7db0e5b7-4679-4608-b189-4fb1d71464fa` | Funda Silicona Llaves 307 408 | `PEUGEOT02` | ? | |
| `ff0f1139-9274-4daa-a276-c03e6c782e9b` | Funda Silicona Llaves 500 Doblo Siena Bravo Palio Mobi | `FIAT01` | ? | |
| `8ec2efd4-58d6-4cbb-a607-2e3bf83b3ffa` | Funda Silicona Llaves A1 A3 A4 A5 A6 A7 Tt Q3 | `AUDI01` | ? | |
| `a369f57d-3074-4b82-b51b-2d50e55c603d` | Funda Silicona Llaves Bora Vento Golf | `VOLK01` | ? | |
| `61dcf94a-8c27-43db-990c-d1138f31aeec` | Funda Silicona Llaves Bora Vento Passat Suran Amarok | `VOLK07` | ? | |
| `4c2693ac-20e9-48b7-9496-16a5356f20e5` | Funda Silicona Llaves C3 | `CITROEN02` | ? | |
| `322a8e14-ad36-40e5-8d8d-4a00c66ed2c6` | Funda Silicona Llaves C3 C4 Picasso Berlingo | `CITROEN03` | ? | |
| `60079d48-25d1-4df7-9ba3-d39a2735a454` | Funda Silicona Llaves C4 Picasso Gran Picasso | `CITROEN01` | ? | |
| `48501964-bfc9-4f07-ab02-68524decfb0b` | Funda Silicona Llaves Celta Astra | `CHEVRO06` | ? | |
| `b590f56a-436e-4cf9-8e48-59d8e2290821` | Funda Silicona Llaves Clio Kangoo Symbol | `RENAULT01` | ? | |
| `48cf3427-d4e1-4219-8038-863191eb3111` | Funda Silicona Llaves Corolla Hilux Etios Sw4 Rav4 | `TOYOTA01` | ? | |
| `de74bd6d-70f2-4f5a-99f8-1683367709b0` | Funda Silicona Llaves Corsa | `CHEVRO02` | ? | |
| `bea06b6e-604c-420e-968b-79c3ff582f2b` | Funda Silicona Llaves Cruze Tracker | `CHEVRO03` | ? | |
| `a26778aa-1e7b-4ec8-8365-d1629b5a8c17` | Funda Silicona Llaves Cruze Tracker | `CHEVRO05` | ? | |
| `ff008bef-46c7-4045-b33d-58f4b04074d3` | Funda Silicona Llaves Ecosport Fiesta Focus | `FORD03` | ? | |
| `79698962-4002-4a93-902c-63855671ef26` | Funda Silicona Llaves Fiat Argo - Cronos - Toro - 500x | `FIAT03` | ? | |
| `05eeda53-9764-4d5f-9f42-d0f4961297e4` | Funda Silicona Llaves Fiat Punto Qubo Ducato Stilo Linea | `FIAT04` | ? | |
| `e95b8edb-cf70-49a3-9d4d-aeedb5cca0ec` | Funda Silicona Llaves Fiesta Focus 1 | `FORD02` | ? | |
| `570e650e-d1a8-42fa-b9e9-9989694cd861` | Funda Silicona Llaves Fit City Crv Civic | `HONDA01` | ? | |
| `7af56576-a9b6-421f-bb54-567ea31e5483` | Funda Silicona Llaves Ford Ka Viejo | `FORD05` | ? | |
| `b057df3c-8f3b-4474-8ebd-94d632ca134b` | Funda Silicona Llaves Fox Suran Qq | `VOLK06` | ? | |
| `f08db3e2-cea9-4bb2-ae8b-51515eea9676` | Funda Silicona Llaves Gol Trend Power Voyage Fox Suran | `VOLK04` | ? | |
| `43d5d643-abce-4fd4-bfa8-0e221f36ed6d` | Funda Silicona Llaves Hilux Sw4 | `TOYOTA02` | ? | |
| `b08afbf2-92ab-45f4-85e2-125c4df3f9cc` | Funda Silicona Llaves Honda Hrv | `HONDA02` | ? | |
| `087e7b18-2d34-4dc0-b131-1f5ee3f34238` | Funda Silicona Llaves Ka New | `FORD04` | ? | |
| `8be22d6c-5188-4508-84c1-4228e9225de5` | Funda Silicona Llaves Kangoo | `RENAULT06` | ? | |
| `51b1c88b-631e-457a-bd78-ad4dcb22b9bd` | Funda Silicona Llaves Kuga Focus Mondeo Fiesta Ovalada | `FORD01` | ? | |
| `8b5bd630-ea07-483d-9f63-df25376a30fa` | Funda Silicona Llaves Kwid | `RENAULT03` | ? | |
| `38a2c8e9-affe-480e-8535-28fd4730d3fb` | Funda Silicona Llaves Logan Duster | `RENAULT02` | ? | |
| `b8b2c896-c33b-4c1a-8d51-670165257a53` | Funda Silicona Llaves Prisma | `CHEVRO01` | ? | |
| `2b81d621-ca9b-4dbe-bb98-52dd57dcc2f1` | Funda Silicona Llaves Ram Journey | `DODGE01` | ? | |
| `5bcb5214-9b33-4d98-b37c-9455131f6495` | Funda Silicona Llaves Renegade | `JEEP01` | ? | |
| `f56660e6-cd34-4608-a10c-db9e622cff2d` | Funda Silicona Llaves Sandero | `RENAULT04` | ? | |
| `268e4e54-2d80-48e2-945a-17e18aeaea37` | Funda Silicona Llaves Strada Idea | `FIAT02` | ? | |
| `b1bdd99e-853e-4ca6-ae49-6b36595e89df` | Funda Silicona Llaves Tarjeta Renault | `RENAULT05` | ? | |
| `edbf4f44-ed88-48b4-9c86-df31066d38b0` | Funda Silicona Llaves Toyota Lineas Viejas 2 Botones | `TOYOTA03` | ? | |
| `c098f767-26b0-49c6-adfd-31f1516bd6a8` | Hilo De Led 3m Blanco A Pilas | `5677` | ? | |
| `prod-1778781897626-eycn5xouj` | INSTRUMENTAL TRIPLE C/VOLTIMETRO (FONDO BLANCO) IAEL | `MA-025` | ? | ⚠️ → "Instrumental Triple C/Voltimetro (Fondo Blanco) Iael" *(ALL CAPS name)* |
| `28a351ac-af30-499e-96cb-837aa4ed9522` | Kit De Cable 4g Blauline | `K-009` | ? | |
| `0c230a02-6ed0-445f-aa60-a55f8b4c4e62` | Kit De Limpieza X 8 Pzas Maletin | `LM-021` | ? | |
| `10e1d85e-0824-4e03-8411-f19b02831c02` | Lubricante W400 Walker 400ml | `7798053622883` | ? | |
| `39aa1075-8a9e-4ba7-8177-668cf51a01f3` | Pegamento Eccole 9g | `ST03045` | ? | |
| `7ef616b4-277d-4adb-a9a5-e534aa084d18` | Pegamento Fastix Blanco 25g | `FASTX B` | ? | |
| `14da6d5d-49d7-4a0f-b8ba-df19f73208d7` | Pegamento Fastix Negro 25g | `ST00524` | ? | |
| `76b77e48-d42c-4f50-a68d-e4062e31e28b` | Pegamento Fastix Transparente 25g | `ST00525` | ? | |
| `a858240d-dcd6-4a89-b7b0-bcb37b474b45` | Pegamento La Gotita 2ml | `ST01718` | ? | |
| `e6fbc728-f0cf-4f33-bbf2-7524aa3f45a0` | Pegamento La Gotita Gel 3g | `LA GOTITA GEL` | ? | |
| `bf3cc031-2f6c-4ab0-9a17-2814cf28f989` | Pegamento Unipox 25ml | `ST01858` | ? | |
| `756cc866-98da-465d-b98f-5ab4fbe7915c` | Pila 2016 Energizer | `CR2016` | ? | |
| `235f7358-2e07-4cbe-a6ba-6b5cd3749ae8` | Pila 2032 Philips | `2032` | ? | |
| `prod-1779983000377-a0o0zku0j` | PILA A23 ENERGIZER | `PRD-1779983000377-YS4I1` | ? | ⚠️ → "Pila A23 Energizer" *(ALL CAPS name)* |
| `prod-1779982932142-rtnutyoal` | PILA A23 ENERGIZER | `PRD-1779982932142-ML314` | ? | ⚠️ → "Pila A23 Energizer" *(ALL CAPS name)* |
| `551777c4-217a-4924-acbc-5fdf28853941` | Pila A544 | `A544` | ? | |
| `3b626f22-3b97-4597-a032-1fcd14de0cc8` | Pila A76 Lr44 | `76A` | ? | |
| `10a03c41-a639-4bce-bd7f-1d23f88a30a9` | Pila Cr1220 | `CR1220` | ? | |
| `5f4f9659-b559-49a7-8c35-bba261450a4d` | Pila Cr1620 | `CR1620` | ? | |
| `3dd1d93d-8a3a-4a99-9ecf-4f593eb2417e` | Pila Cr2025 | `CR2025` | ? | |
| `6a081770-0052-4c6a-8fef-f5045e186254` | Pinza Cocodrilo Mediana 20 Amp | `REB1020` | ? | |
| `813b1e4c-f860-4f45-90f8-3091fa725c10` | Protector De Puerta Adhesivo | `PR-016` | ? | |
| `80f4d3f3-3ff5-4123-9445-bc46c6861ff3` | Protector De Puerta X 4siliconada | `2066` | ? | |
| `prod-1779815962679-vrf3pf44b` | REFRIGERANTE PROMOCION (KIT) | `PRD-1779815962679-FBF0E` | ? | ⚠️ → "Refrigerante Promocion (KIT)" *(ALL CAPS name)* |
| `92341083-b7ae-44de-9896-bfc0c53bf326` | Strech Aluminio Mate | `AE-507` | ? | |
| `93fc77e9-133d-4aa1-ad25-6e7f126d7033` | Strech Amarillo | `AE-108` | ? | |
| `383c7ee5-0c18-495f-be75-61f46e673657` | Strech Amarillo Fluo | `AE-303` | ? | |
| `ab93ce74-3b1a-4ea6-a73a-3774ebd371bb` | Strech Amarillo Perlado | `AE-503` | ? | |
| `d887743c-a687-457c-b433-6690d66e3883` | Strech Azul | `AE-105` | ? | |
| `47aeb748-44b9-4aad-b467-dcc022c0a6c4` | Strech Azul Perla | `AE-505` | ? | |
| `ac37a369-7920-419a-ad06-075e511b948a` | Strech Blanco Mate | `AE-103` | ? | |
| `9733a22c-4bd1-4152-b989-a819be6bd468` | Strech Blanco Perlado | `AE-508` | ? | |
| `55d1e331-4359-4243-af72-3c356877fd57` | Strech Bronce | `AE-204` | ? | |
| `08980f0e-b267-4809-858e-310f41616392` | Strech Bronce Oscuro | `AE-205` | ? | |
| `b654e491-f9b7-4e5b-a5bf-dae0cf15f3ac` | Strech Camaleon Boreal Night | `AE-701` | ? | |
| `b28c7ba8-5f46-4394-87e1-7dcd97385db9` | Strech Camaleon Hyper Blue | `AE-702` | ? | |
| `df4f392e-6426-41a2-97f6-6c8f0215e1b8` | Strech Camaleon Hyper Green | `AE-704` | ? | |
| `ad83b06a-edf7-4613-a00f-264bb6a99aa0` | Strech Camaleon Sunrise | `AE-703` | ? | |
| `78278c03-0b36-489c-b467-40f41076cfb0` | Strech Camel Mate | `AE-115` | ? | |
| `ed3ae9f1-adda-4f6c-88d7-07a91b0ad19c` | Strech Dorado | `AE-201` | ? | |
| `7a4497e0-dd9c-4b07-ba75-db626fcf836c` | Strech Fume | `AE-403` | ? | |
| `faa92c1e-30e0-4bce-b677-e83aa7e9a632` | Strech Fume Brilloso | `AE-404` | ? | |
| `6cec0726-f396-41ed-9970-5d80a910d77f` | Strech Gris Grafito Vizon Metal | `AE-206` | ? | |
| `c4e3770a-c5c3-4ee7-9178-17161d794a9d` | Strech Gris Mate | `AE-102` | ? | |
| `ae7f2ebb-28cd-416e-8606-665056bc6b79` | Strech Laca Brillo | `AE-401` | ? | |
| `f64f32a7-0de3-43db-9a4d-b7054f50dc66` | Strech Magenta Mate | `AE-112` | ? | |
| `68b1b779-0a92-4756-ae50-298e8640ed8c` | Strech Naranja Fluo | `AE-304` | ? | |
| `63383bf5-9795-4b7d-88d4-39e9dc8cc162` | Strech Naranja Mate | `AE-107` | ? | |
| `e092bcfb-0aa0-48c5-8c9f-9f991e060ea8` | Strech Negro Brilloso | `AE-100` | ? | |
| `prod-1783516069615-or93j0ke2` | strech negro mate  | `ae-101` | ? | |
| `53846e78-998f-48b2-9068-8cd91f514e68` | Strech Rojo Mate | `AE-104` | ? | |
| `d181fed5-8d5d-44f6-88e5-7b75bf920dbd` | Strech Rojo Perla | `AE-504` | ? | |
| `b46b4bfb-30c1-4ee7-b5d2-247c59925694` | Strech Rosa | `AE-111` | ? | |
| `3bb19cc9-d6ef-4fe5-b77a-548c9e14b67e` | Strech Turquesa | `AE-106` | ? | |
| `adeafaa6-2896-408a-9480-e237f0e98c24` | Strech Verde | `AE-109` | ? | |
| `286e4ffb-6ae9-41c7-8a55-9d3f7edf5b50` | Strech Verde Fluo | `AE-302` | ? | |
| `d3d7a676-6eeb-4d71-bd23-73c89ab15e1a` | Strech Verde Militar | `AE-114` | ? | |
| `426ad88d-bc0c-42d4-80fe-4f39b84e67c1` | Strech Verde Perla | `AE-502` | ? | |
| `50e6f9c1-5361-4bef-97d0-7b0ae62478b3` | Strech Violeta | `AE-110` | ? | |
| `639b9363-32f6-487a-baa2-309f5c460f37` | Strech Violeta Perla | `AE-501` | ? | |
| `62eb0b1a-0563-442d-89f9-0155bdbd4bf1` | Voltimetro Para Embutir Economico | `ZN-056-100V` | ? | |

| **SQL — Renombrar productos** |
|---|---|
```sql
UPDATE product SET name = 'Cepillo Taladro KIT X 3' WHERE id = 'prod-1782569581743-vtd0687lu';
UPDATE product SET name = 'Instrumental Triple C/Voltimetro (Fondo Blanco) Iael' WHERE id = 'prod-1778781897626-eycn5xouj';
UPDATE product SET name = 'Pila A23 Energizer' WHERE id = 'prod-1779983000377-a0o0zku0j';
UPDATE product SET name = 'Pila A23 Energizer' WHERE id = 'prod-1779982932142-rtnutyoal';
UPDATE product SET name = 'Refrigerante Promocion (KIT)' WHERE id = 'prod-1779815962679-vrf3pf44b';
```

---

### 14. Seguridad Vial

**SQL — Crear categoría:**
```sql
INSERT INTO category (id, name, description, color, "sortOrder", "isActive")
VALUES ('cat-seguridad-vial', 'Seguridad Vial', 'Botiquines, balizas, kits de emergencia, matafuegos, cables puente, elementos de seguridad vial', '#E11D48', 14, true);
```

**SQL — Asignar productos a esta categoría:**
```sql
UPDATE product SET "categoryId" = 'cat-seguridad-vial' WHERE id IN (
  'b1df0360-d4dd-4b96-8787-df2300e70ba8',
  '1c5ace5b-d839-4f9e-b923-57c0453faa55',
  'f6aaaa38-92f5-4206-b514-f4b807eb3d67',
  '5551c4cc-fc45-4c5d-975a-d30920662943',
  'c924d954-080b-4ad4-8e96-e3cc9828c053',
  '1624b9a5-35c8-41b1-b43f-8cfc50792d10',
  'feec0fac-a160-4690-a5d8-e7d0d10b9855'
);
```

**Productos (7):**

| ID | Nombre | SKU | Stock |
|---|---|---|---|
| `b1df0360-d4dd-4b96-8787-df2300e70ba8` | Baliza Reflectiva C/estuche | `SG-011 SG-010` | ? |
| `1c5ace5b-d839-4f9e-b923-57c0453faa55` | Balizas Reflectivas Economica (Par) | `SG-013` | ? |
| `f6aaaa38-92f5-4206-b514-f4b807eb3d67` | Botiquin Auxiliar Grande | `SG-008` | ? |
| `5551c4cc-fc45-4c5d-975a-d30920662943` | Botiquin Chico Reglamentario | `SG-007` | ? |
| `c924d954-080b-4ad4-8e96-e3cc9828c053` | Botiquin Economico | `SG-999` | ? |
| `1624b9a5-35c8-41b1-b43f-8cfc50792d10` | Iael Booster Para Niños De 15 A 36 Kg | `AB-001` | ? |
| `feec0fac-a160-4690-a5d8-e7d0d10b9855` | Manta Reglamentaria | `SG-014` | ? |

| **SQL — Renombrar productos** |
|---|---|
_No se requieren renombres en esta categoría._

---

### 15. Aromatizantes

**SQL — Crear categoría:**
```sql
INSERT INTO category (id, name, description, color, "sortOrder", "isActive")
VALUES ('cat-aromatizantes', 'Aromatizantes', 'Aromatizantes y atomizadores ambientales para el vehículo', '#FCD34D', 15, true);
```

**SQL — Asignar productos a esta categoría:**
```sql
UPDATE product SET "categoryId" = 'cat-aromatizantes' WHERE id IN (
  '09ecd2dd-0a3c-4bd0-87a3-d87fbc44c8da',
  'prod-1778694469927-tx95v6xzp',
  'prod-1778534923033-kgt59a2cw',
  'e3489bfe-8e89-4eed-990e-eb4fcd78effe'
);
```

**Productos (4):**

| ID | Nombre actual | SKU | Stock | Sugerencia |
|---|---|---|---|---|
| `09ecd2dd-0a3c-4bd0-87a3-d87fbc44c8da` | Glade Latita 70gr Gel | `LG-CITRUS` | ? | |
| `prod-1778694469927-tx95v6xzp` | PERFUME PARA COLGAR MYSTIC BALSAM AROMATIZANTE PARA AUTO | `PRD-1778694469926-W1KK4` | ? | ⚠️ → "Perfume Para Colgar Mystic Balsam Aromatizante Para Auto" *(ALL CAPS name)* |
| `prod-1778534923033-kgt59a2cw` | Pinito Walker | `Perfumes` | ? | |
| `e3489bfe-8e89-4eed-990e-eb4fcd78effe` | Walker Yony Muñeco Perfumado | `YONYWALKER` | ? | |

| **SQL — Renombrar productos** |
|---|---|
```sql
UPDATE product SET name = 'Perfume Para Colgar Mystic Balsam Aromatizante Para Auto' WHERE id = 'prod-1778694469927-tx95v6xzp';
```

---

---
*Documento generado el 2026-07-10 | 1800 productos | 15 categorías*
