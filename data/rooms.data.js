window.TEMPLE_DATA = {
  "schemaVersion": 1,
  "lastValidated": "2026-06-01",
  "gameVersion": "0.5",
  "source": "0.5 client unpack: Content.ggpk:data/balance/incursion2*.datc64 (Incursion2*) + existing local strategy metadata",
  "notes": "0.5 client unpack sync. Room data (tiers, modBonus byTier, upgrade chains, drops) reflect the 0.5 installed client. maxTier=4 数据已解包(0.5 解锁 T4),Incursion2RoomPerLevel 现含 Level 4 行(结构同 L1-3、无特殊解锁门禁)。t4Unlockable 现按 maxTier>=4 自动置 true:T4 是房间正常可升的第 4 级。。**Atlas 全点加成(2026-06-03 落地)**:见 atlasFullClear 字段 — T4 解锁/Royal Prerogative 免塌/temple_bonus 缩放(Power Relays+Efficient Arteries+Xipocado,三节点同类 increased 求和)均已建模。放大家族归属已由 map_temple_room_stat_descriptions.csd 解包 tooltip 原文 + temple_mods.json boss 包锚定定论(Spymaster=实验室/Golem=战斗/Thaum=奥术,见各房 notes)。**biome 房(2026-06 纳入)**:6 个 biome 房(biome_water/mountain/grass/forest/swamp/desert,Incursion2Rooms _index 31-36)已作数据条目纳入。category=biome,oneShot 可达即塌,modBonus 空(GGPK Mod 16669-16674 是纯 biome 标签 AreaCountsAs*Biome,非 loot stat),valueClass=very-low(scoring 贡献 0)。**未接入 sweep/MC**:oneShot 房不进手牌池,不参与 Monte Carlo / strategy search;具体玩法/收益待实测建模。",
  "rooms": [
    {
      "id": "entrance",
      "name_zh": "入口",
      "name_en": "Entrance",
      "category": "path",
      "tierChain": [
        "Entrance"
      ],
      "maxTier": 0,
      "t4Unlockable": false,
      "needsPower": false,
      "powerCount": 0,
      "snakeRole": "none",
      "oneShot": true,
      "fixedSlot": true,
      "destabiliseEligible": false,
      "valueClass": "very-low",
      "notes": "底部中央(south-center),固定。",
      "unpackedId": "Entrance",
      "unpackedRoomIndex": 21,
      "unpackedName": "Entrance",
      "unpackedFlags": {
        "isPathway": true,
        "isPresentDay": true,
        "isBossReward": false,
        "upgradedByPower": 0
      },
      "unpackedLevels": [
        {
          "level": 1,
          "id": "entrance",
          "name": "Foyer",
          "mod": null,
          "modValues": [],
          "description": "",
          "description2": ""
        }
      ],
      "dataSource": {
        "unpacked": "Content.ggpk:data/balance/incursion2*.datc64",
        "unpackedAt": "2026-06-01"
      },
      "mechanicSource": {
        "acceptedSources": [
          "ggpk_dat_exports",
          "schema_min_json",
          "official_patch_notes",
          "live_observations"
        ],
        "excludedSources": [
          "third_party_frontend_source"
        ],
        "ggpkUpgradeStatus": "no_ggpk_upgrade_sources",
        "upgradeSources": {
          "ggpk": [],
          "local": [],
          "missingFromLocal": [],
          "extraInLocal": []
        },
        "upgradeSemantics": "no_tracked_ggpk_upgrade_rule",
        "powerTier": "none"
      }
    },
    {
      "id": "path",
      "name_zh": "通路",
      "name_en": "Path",
      "category": "path",
      "tierChain": [
        "Path"
      ],
      "maxTier": 0,
      "t4Unlockable": false,
      "needsPower": false,
      "powerCount": 0,
      "snakeRole": "filler",
      "oneShot": false,
      "fixedSlot": false,
      "destabiliseEligible": false,
      "valueClass": "very-low",
      "notes": "纯通道。0.5 下被瓦解但不能移除的房间会降级为此。",
      "unpackedId": "Path",
      "unpackedRoomIndex": 1,
      "unpackedName": "Path",
      "unpackedFlags": {
        "isPathway": true,
        "isPresentDay": true,
        "isBossReward": false,
        "upgradedByPower": 0
      },
      "unpackedLevels": [
        {
          "level": 1,
          "id": "",
          "name": "Path",
          "mod": 15010,
          "modValues": [
            40
          ],
          "description": "",
          "description2": ""
        }
      ],
      "dataSource": {
        "unpacked": "Content.ggpk:data/balance/incursion2*.datc64",
        "unpackedAt": "2026-06-01"
      },
      "mechanicSource": {
        "acceptedSources": [
          "ggpk_dat_exports",
          "schema_min_json",
          "official_patch_notes",
          "live_observations"
        ],
        "excludedSources": [
          "third_party_frontend_source"
        ],
        "ggpkUpgradeStatus": "no_ggpk_upgrade_sources",
        "upgradeSources": {
          "ggpk": [],
          "local": [],
          "missingFromLocal": [],
          "extraInLocal": []
        },
        "upgradeSemantics": "no_tracked_ggpk_upgrade_rule",
        "powerTier": "none"
      }
    },
    {
      "id": "garrison",
      "name_zh": "驻军地",
      "name_en": "Garrison",
      "category": "utility",
      "tierChain": [
        "Guardhouse",
        "Barracks",
        "Hall of War",
        "Warrior Assembly"
      ],
      "maxTier": 4,
      "t4Unlockable": true,
      "needsPower": false,
      "powerCount": 0,
      "snakeRole": "critical",
      "oneShot": false,
      "fixedSlot": false,
      "destabiliseEligible": true,
      "valueClass": "mid",
      "upgradeAdjacency": {
        "2": {
          "rooms": [
            "commander",
            "armoury"
          ],
          "count": 1
        },
        "3": {
          "rooms": [
            "commander",
            "armoury"
          ],
          "requireAll": true
        }
      },
      "modBonus": [
        {
          "stat": "pack_size",
          "byTier": [
            8,
            12,
            16,
            20
          ],
          "source": "unpacked:Incursion2RoomPerLevel.ModValues"
        },
        {
          "stat": "normal_monster_effectiveness",
          "byTier": [
            0,
            10,
            20,
            40
          ],
          "source": "unpacked:Incursion2RoomPerLevel.ModValues"
        }
      ],
      "notes": "Snake 三件套之一。生成守军怪。**poe2db**:T1/T2/T3 pack_size +10/15/20%;T2/T3 额外 normal monster effectiveness +15/30%。升级来源由 GGPK Incursion2Rooms.UpgradedBy=Commander/Armoury 确认;count/requireAll 为本地模型语义,需实测或官方文本复核。",
      "unpackedId": "Garrison",
      "unpackedRoomIndex": 3,
      "unpackedName": "Garrison",
      "unpackedFlags": {
        "isPathway": false,
        "isPresentDay": true,
        "isBossReward": false,
        "upgradedByPower": 0
      },
      "unpackedLevels": [
        {
          "level": 1,
          "id": "garrison_lvl1",
          "name": "Guardhouse",
          "mod": 14911,
          "modValues": [
            8,
            0
          ],
          "description": "",
          "description2": ""
        },
        {
          "level": 2,
          "id": "garrison_lvl2",
          "name": "Barracks",
          "mod": 14911,
          "modValues": [
            12,
            10
          ],
          "description": "",
          "description2": ""
        },
        {
          "level": 3,
          "id": "garrison_lvl3",
          "name": "Hall of War",
          "mod": 14911,
          "modValues": [
            16,
            20
          ],
          "description": "",
          "description2": ""
        },
        {
          "level": 4,
          "id": "garrison_lvl4",
          "name": "Warrior Assembly",
          "mod": 14911,
          "modValues": [
            20,
            40
          ],
          "description": "",
          "description2": ""
        }
      ],
      "dataSource": {
        "unpacked": "Content.ggpk:data/balance/incursion2*.datc64",
        "unpackedAt": "2026-06-01"
      },
      "clientDescription": [
        "May contain a bench allowing modification of [Equipment]"
      ],
      "mechanicSource": {
        "acceptedSources": [
          "ggpk_dat_exports",
          "schema_min_json",
          "official_patch_notes",
          "live_observations"
        ],
        "excludedSources": [
          "third_party_frontend_source"
        ],
        "ggpkUpgradeStatus": "ggpk_source_set_confirmed_semantics_local",
        "upgradeSources": {
          "ggpk": [
            "armoury",
            "commander"
          ],
          "local": [
            "armoury",
            "commander"
          ],
          "missingFromLocal": [],
          "extraInLocal": []
        },
        "upgradeSemantics": "source_set_ggpk_confirmed_semantics_local",
        "powerTier": "none"
      }
    },
    {
      "id": "commander",
      "name_zh": "指挥官",
      "name_en": "Commander",
      "category": "utility",
      "tierChain": [
        "Commander's Chamber",
        "Commander's Hall",
        "Commander's Headquarters",
        "Commander's Station"
      ],
      "maxTier": 4,
      "t4Unlockable": true,
      "needsPower": false,
      "powerCount": 0,
      "snakeRole": "filler",
      "oneShot": false,
      "fixedSlot": false,
      "destabiliseEligible": true,
      "valueClass": "mid",
      "medallionDrops": {
        "1": ["quipolatl", "uromoti"],
        "2": ["quipolatl", "uromoti"],
        "3": ["uromoti", "zantipi"],
        "4": ["uromoti", "zantipi"]
      },
      "medallionDropsSource": "GGPK Incursion2RoomPerLevel.Description2 一手解码 2026-06-03",
      "upgradeAdjacency": {
        "2": {
          "rooms": [
            "garrison",
            "transcendent_barracks"
          ],
          "count": 2
        },
        "3": {
          "rooms": [
            "garrison",
            "transcendent_barracks"
          ],
          "count": 3
        }
      },
      "modBonus": [
        {
          "stat": "rare_effectiveness",
          "byTier": [
            10,
            25,
            50,
            75
          ],
          "source": "unpacked:Incursion2RoomPerLevel.ModValues"
        }
      ],
      "t3Special": "vaal_seals",
      "notes": "增强守军 buff。**poe2db**:T1/T2/T3 rare monster effectiveness +15/30/60%;T3 掉 Vaal 印记(4 种)。升级来源由 GGPK Incursion2Rooms.UpgradedBy=Garrison×3/TranscendentBarracks×3 确认(GGPK 原始 UpgradedBy=[3,3,3,12,12,12],index3=Garrison/index12=TranscendentBarracks,各 ×3),与 poe2db 写「Garrison ×3 / Transcendent Barracks ×3」一致。**count(2026-06-02 复核)**:poe2db/GGPK 都写 ×3,但 ×3 是 UpgradedBy 列表多重度(终态/最高级所需),**不含逐级 count 分解**。本地把它拆成 T2=count:2 / T3=count:3 是模型推导;无任何来源能确认 T2 是否也需 3 个,故保守保留现状(T2=2/T3=3),待实测确认 T2 门槛。",
      "unpackedId": "Commander",
      "unpackedRoomIndex": 4,
      "unpackedName": "Commander",
      "unpackedFlags": {
        "isPathway": false,
        "isPresentDay": true,
        "isBossReward": false,
        "upgradedByPower": 0
      },
      "unpackedLevels": [
        {
          "level": 1,
          "id": "commander_lvl1",
          "name": "Commander's Chamber",
          "mod": 14912,
          "modValues": [
            10
          ],
          "description": "",
          "description2": "May drop [IncursionMedallionIncreaseRoomTier|Quipolatl's Medallion] or [IncursionMedallionAddRoom|Uromoti's Medallion]"
        },
        {
          "level": 2,
          "id": "commander_lvl2",
          "name": "Commander's Hall",
          "mod": 14912,
          "modValues": [
            25
          ],
          "description": "",
          "description2": "May drop [IncursionMedallionIncreaseRoomTier|Quipolatl's Medallion] or [IncursionMedallionAddRoom|Uromoti's Medallion]"
        },
        {
          "level": 3,
          "id": "commander_lvl3",
          "name": "Commander's Headquarters",
          "mod": 14912,
          "modValues": [
            50
          ],
          "description": "",
          "description2": "May drop [IncursionMedallionAddRoom|Uromoti's Medallion] or [IncursionMedallionAddTempleModifier|Zantipi's Medallion]"
        },
        {
          "level": 4,
          "id": "commander_lvl4",
          "name": "Commander's Station",
          "mod": 14912,
          "modValues": [
            75
          ],
          "description": "",
          "description2": "May drop [IncursionMedallionAddRoom|Uromoti's Medallion] or [IncursionMedallionAddTempleModifier|Zantipi's Medallion]"
        }
      ],
      "dataSource": {
        "unpacked": "Content.ggpk:data/balance/incursion2*.datc64",
        "unpackedAt": "2026-06-01"
      },
      "clientDescription": [
        "May contain a bench allowing modification of [Equipment]"
      ],
      "clientDropText": [
        "May drop [IncursionMedallionIncreaseRoomTier|Quipolatl's Medallion] or [IncursionMedallionAddRoom|Uromoti's Medallion]",
        "May drop [IncursionMedallionAddRoom|Uromoti's Medallion] or [IncursionMedallionAddTempleModifier|Zantipi's Medallion]"
      ],
      "mechanicSource": {
        "acceptedSources": [
          "ggpk_dat_exports",
          "schema_min_json",
          "official_patch_notes",
          "live_observations"
        ],
        "excludedSources": [
          "third_party_frontend_source"
        ],
        "ggpkUpgradeStatus": "ggpk_source_set_confirmed_semantics_local",
        "upgradeSources": {
          "ggpk": [
            "garrison",
            "transcendent_barracks"
          ],
          "local": [
            "garrison",
            "transcendent_barracks"
          ],
          "missingFromLocal": [],
          "extraInLocal": []
        },
        "upgradeSemantics": "source_set_ggpk_confirmed_semantics_local",
        "powerTier": "none"
      }
    },
    {
      "id": "armoury",
      "name_zh": "装备库",
      "name_en": "Armoury",
      "category": "utility",
      "tierChain": [
        "Depot",
        "Arsenal",
        "Gallery",
        "Royal Reserves"
      ],
      "maxTier": 4,
      "t4Unlockable": true,
      "needsPower": false,
      "powerCount": 0,
      "snakeRole": "critical",
      "oneShot": false,
      "fixedSlot": false,
      "destabiliseEligible": true,
      "valueClass": "mid",
      "upgradeAdjacency": {
        "2": {
          "rooms": [
            "smithy",
            "alchemy_lab"
          ],
          "count": 1
        },
        "3": {
          "rooms": [
            "smithy",
            "alchemy_lab"
          ],
          "requireAll": true
        }
      },
      "modBonus": [
        {
          "stat": "humanoid_effectiveness",
          "byTier": [
            10,
            25,
            50,
            75
          ],
          "source": "unpacked:Incursion2RoomPerLevel.ModValues"
        }
      ],
      "t3Special": "contains_rare_equipment",
      "notes": "Snake 三件套之一。守军装备升级。**poe2db**:T1/T2/T3 humanoid monster effectiveness +15/30/60%;T3 含稀有装备。升级来源由 GGPK Incursion2Rooms.UpgradedBy=Smithy/AlchemyLab 确认;分级语义为本地模型推导。",
      "unpackedId": "Armoury",
      "unpackedRoomIndex": 5,
      "unpackedName": "Armoury",
      "unpackedFlags": {
        "isPathway": false,
        "isPresentDay": true,
        "isBossReward": false,
        "upgradedByPower": 0
      },
      "unpackedLevels": [
        {
          "level": 1,
          "id": "armoury_lvl1",
          "name": "Depot",
          "mod": 14913,
          "modValues": [
            10
          ],
          "description": "Contains [Equipment]",
          "description2": ""
        },
        {
          "level": 2,
          "id": "armoury_lvl2",
          "name": "Arsenal",
          "mod": 14913,
          "modValues": [
            25
          ],
          "description": "Contains [Equipment]",
          "description2": ""
        },
        {
          "level": 3,
          "id": "armoury_lvl3",
          "name": "Gallery",
          "mod": 14913,
          "modValues": [
            50
          ],
          "description": "Contains [Rarity|Rare] [Equipment]",
          "description2": ""
        },
        {
          "level": 4,
          "id": "armoury_lvl4",
          "name": "Royal Reserves",
          "mod": 14913,
          "modValues": [
            75
          ],
          "description": "Contains [Rarity|Rare] [Equipment]",
          "description2": ""
        }
      ],
      "dataSource": {
        "unpacked": "Content.ggpk:data/balance/incursion2*.datc64",
        "unpackedAt": "2026-06-01"
      },
      "clientDescription": [
        "Contains [Equipment]",
        "Contains [Rarity|Rare] [Equipment]"
      ],
      "mechanicSource": {
        "acceptedSources": [
          "ggpk_dat_exports",
          "schema_min_json",
          "official_patch_notes",
          "live_observations"
        ],
        "excludedSources": [
          "third_party_frontend_source"
        ],
        "ggpkUpgradeStatus": "ggpk_source_set_confirmed_semantics_local",
        "upgradeSources": {
          "ggpk": [
            "alchemy_lab",
            "smithy"
          ],
          "local": [
            "alchemy_lab",
            "smithy"
          ],
          "missingFromLocal": [],
          "extraInLocal": []
        },
        "upgradeSemantics": "source_set_ggpk_confirmed_semantics_local",
        "powerTier": "none"
      }
    },
    {
      "id": "smithy",
      "name_zh": "铁匠铺",
      "name_en": "Smithy",
      "category": "craft",
      "tierChain": [
        "Bronzeworks",
        "Chamber of Iron",
        "Golden Forge",
        "Immaculate Forge"
      ],
      "maxTier": 4,
      "t4Unlockable": true,
      "needsPower": true,
      "powerCount": 1,
      "snakeRole": "filler",
      "oneShot": false,
      "fixedSlot": false,
      "destabiliseEligible": true,
      "valueClass": "high",
      "medallionDrops": {
        "1": ["quipolatl", "uromoti"],
        "2": ["quipolatl", "uromoti"],
        "3": ["juatalotli", "hayoxi", "uromoti", "estazunti", "zantipi"],
        "4": ["juatalotli", "hayoxi", "uromoti", "estazunti", "zantipi"]
      },
      "medallionDropsSource": "GGPK Incursion2RoomPerLevel.Description2 一手解码 2026-06-03",
      "upgradeAdjacency": {
        "2": {
          "rooms": [
            "golem_works"
          ],
          "count": 1
        },
        "3": {
          "rooms": [
            "golem_works"
          ],
          "count": 1,
          "requiresPower": true
        }
      },
      "modBonus": [
        {
          "stat": "chest_item_rarity",
          "byTier": [
            15,
            30,
            60,
            90
          ],
          "source": "unpacked:Incursion2RoomPerLevel.ModValues"
        }
      ],
      "t3Special": "vaal_armourer_infuser",
      "notes": "需供能(曼哈顿距离内的 Generator,**不**需邻接)。**poe2db**:T1/T2/T3 chest item rarity +15/30/60%;**0.5 PN**:旧 Vaal Infuser 拆为 4 种(Armourer/Martial Weapon/Caster Weapon/Jewellery),Smithy T3 给的 Masterwork Forge 现产 Vaal Armourer's Infuser(只对护甲)。其它 3 种来源待 0.5 落地后查。**升级邻接(poe2wiki line 558)**:T2 = Golem Works 邻接;T3 = Golem Works 邻接 **+ Generator 供能**(requiresPower)。**GGPK 语义(2026-06 schema 核对)**:Incursion2Rooms 仅有 UpgradedBy(房型引用数组,重复=数量)+ UpgradedByPower 两列,**无 count/requireAll/minTier/requiresPower 字段**。升级源房型由 GGPK UpgradedBy=[GolemWorks] + UpgradedByPower=1 确认;count=1/requiresPower 为本地模型语义,数量/供能门槛待官方文本或实测复核。",
      "unpackedId": "Smithy",
      "unpackedRoomIndex": 6,
      "unpackedName": "Smithy",
      "unpackedFlags": {
        "isPathway": false,
        "isPresentDay": true,
        "isBossReward": false,
        "upgradedByPower": 1
      },
      "unpackedLevels": [
        {
          "level": 1,
          "id": "smithy_lvl1",
          "name": "Bronzeworks",
          "mod": 14914,
          "modValues": [
            15
          ],
          "description": "Contains the Forging Workbench which can be used to improve [Quality] of [Equipment]",
          "description2": "May drop [IncursionMedallionIncreaseRoomTier|Quipolatl's Medallion] or [IncursionMedallionAddRoom|Uromoti's Medallion]"
        },
        {
          "level": 2,
          "id": "smithy_lvl2",
          "name": "Chamber of Iron",
          "mod": 14914,
          "modValues": [
            30
          ],
          "description": "Contains the Forging Mechanism which can be used to add an [Augment] socket to [Equipment]",
          "description2": "May drop [IncursionMedallionIncreaseRoomTier|Quipolatl's Medallion] or [IncursionMedallionAddRoom|Uromoti's Medallion]"
        },
        {
          "level": 3,
          "id": "smithy_lvl3",
          "name": "Golden Forge",
          "mod": 14914,
          "modValues": [
            60
          ],
          "description": "Contains the Masterwork Forge which can be used to increase the [Quality] of an [Equipment] item that already has 20% [Quality]",
          "description2": "May drop [IncursionMedallionPreventDestabilise|Juatalotli's Medallion], [IncursionMedallionRerollRestrictedRoom|Hayoxi's Medallion], [IncursionMedallionAddRoom|Uromoti's Medallion], [IncursionMedallionAddAdditionalRestrictedRoom|Estazunti's Medallion] or [IncursionMedallionAddTempleModifier|Zantipi's Medallion]"
        },
        {
          "level": 4,
          "id": "smithy_lvl4",
          "name": "Immaculate Forge",
          "mod": 14914,
          "modValues": [
            90
          ],
          "description": "Contains the Masterwork Forge which can be used to increase the [Quality] of an [Equipment] item that already has 20% [Quality]\r\n[Rarity|Unique] Boss drops additional Infusers",
          "description2": "May drop [IncursionMedallionPreventDestabilise|Juatalotli's Medallion], [IncursionMedallionRerollRestrictedRoom|Hayoxi's Medallion], [IncursionMedallionAddRoom|Uromoti's Medallion], [IncursionMedallionAddAdditionalRestrictedRoom|Estazunti's Medallion] or [IncursionMedallionAddTempleModifier|Zantipi's Medallion]"
        }
      ],
      "dataSource": {
        "unpacked": "Content.ggpk:data/balance/incursion2*.datc64",
        "unpackedAt": "2026-06-01"
      },
      "clientDescription": [
        "Contains the Forging Workbench which can be used to improve [Quality] of [Equipment]",
        "Contains the Forging Mechanism which can be used to add an [Augment] socket to [Equipment]",
        "Contains the Masterwork Forge which can be used to increase the [Quality] of an [Equipment] item that already has 20% [Quality]",
        "Contains the Masterwork Forge which can be used to increase the [Quality] of an [Equipment] item that already has 20% [Quality] [Rarity|Unique] Boss drops additional Infusers"
      ],
      "clientDropText": [
        "May drop [IncursionMedallionIncreaseRoomTier|Quipolatl's Medallion] or [IncursionMedallionAddRoom|Uromoti's Medallion]",
        "May drop [IncursionMedallionPreventDestabilise|Juatalotli's Medallion], [IncursionMedallionRerollRestrictedRoom|Hayoxi's Medallion], [IncursionMedallionAddRoom|Uromoti's Medallion], [IncursionMedallionAddAdditionalRestrictedRoom|Estazunti's Medallion] or [IncursionMedallionAddTempleModifier|Zantipi's Medallion]"
      ],
      "mechanicSource": {
        "acceptedSources": [
          "ggpk_dat_exports",
          "schema_min_json",
          "official_patch_notes",
          "live_observations"
        ],
        "excludedSources": [
          "third_party_frontend_source"
        ],
        "ggpkUpgradeStatus": "ggpk_source_set_confirmed_semantics_local",
        "upgradeSources": {
          "ggpk": [
            "golem_works"
          ],
          "local": [
            "golem_works"
          ],
          "missingFromLocal": [],
          "extraInLocal": []
        },
        "upgradeSemantics": "source_set_ggpk_confirmed_semantics_local",
        "powerTier": "ggpk_power_flag_present_semantics_local"
      }
    },
    {
      "id": "generator",
      "name_zh": "发电机",
      "name_en": "Generator",
      "category": "power",
      "tierChain": [
        "Dynamo",
        "Shrine of Empowerment",
        "Solar Nexus",
        "Infinite Horizon"
      ],
      "maxTier": 4,
      "t4Unlockable": true,
      "needsPower": false,
      "powerCount": 0,
      "snakeRole": "filler",
      "oneShot": false,
      "fixedSlot": false,
      "destabiliseEligible": true,
      "valueClass": "mid",
      "powerRangeByTier": [
        3,
        4,
        5,
        6
      ],
      "upgradeAdjacency": {
        "2": {
          "rooms": [
            "thaumaturge",
            "sacrificial_chamber"
          ],
          "count": 1
        },
        "3": {
          "rooms": [
            "thaumaturge",
            "sacrificial_chamber"
          ],
          "requireAll": true
        }
      },
      "modBonus": [
        {
          "stat": "construct_effectiveness",
          "byTier": [
            10,
            25,
            50,
            75
          ],
          "source": "unpacked:Incursion2RoomPerLevel.ModValues"
        }
      ],
      "t3Special": "adds_royal_colossus",
      "notes": "曼哈顿距离辐射:T1=3, T2=4, T3=5 格。**poe2db**:T1/T2/T3 construct effectiveness +15/30/60%;T3 添加皇家巨像。升级来源由 GGPK Incursion2Rooms.UpgradedBy=Thaumaturge/SacrificialChamber 确认;距离/供能范围为本地模型,需复核。**T4(Infinite Horizon,0.5)**:供能范围 6 格(GGPK ModValues[75,1],第二值 1=范围扩展,IDA 公式 distance<tier+2 推算 T4=6)。T3+ 额外生成一组 VaalColossus Boss 怪包(ModValues[1]=1)。construct_monster_potency T4=75%(stat map_construct_monster_potency_+%)。**GGPK 确认**:PowerRadius 不在 GGPK 数据表,辐射范围硬编码在服务端逻辑。",
      "unpackedId": "Generator",
      "unpackedRoomIndex": 7,
      "unpackedName": "Generator",
      "unpackedFlags": {
        "isPathway": false,
        "isPresentDay": true,
        "isBossReward": false,
        "upgradedByPower": 0
      },
      "unpackedLevels": [
        {
          "level": 1,
          "id": "generator_lvl1",
          "name": "Dynamo",
          "mod": 14920,
          "modValues": [
            10,
            0
          ],
          "description": "Provides [IncursionPower|Power] to nearby rooms, increasing in distance with Room tier",
          "description2": ""
        },
        {
          "level": 2,
          "id": "generator_lvl2",
          "name": "Shrine of Empowerment",
          "mod": 14920,
          "modValues": [
            25,
            0
          ],
          "description": "Provides [IncursionPower|Power] to nearby rooms, increasing in distance with Room tier",
          "description2": ""
        },
        {
          "level": 3,
          "id": "generator_lvl3",
          "name": "Solar Nexus",
          "mod": 14920,
          "modValues": [
            50,
            1
          ],
          "description": "Provides [IncursionPower|Power] to nearby rooms, increasing in distance with Room tier",
          "description2": ""
        },
        {
          "level": 4,
          "id": "generator_lvl4",
          "name": "Infinite Horizon",
          "mod": 14920,
          "modValues": [
            75,
            1
          ],
          "description": "Provides [IncursionPower|Power] to nearby rooms, increasing in distance with Room tier",
          "description2": ""
        }
      ],
      "dataSource": {
        "unpacked": "Content.ggpk:data/balance/incursion2*.datc64",
        "unpackedAt": "2026-06-01"
      },
      "clientDescription": [
        "Provides [IncursionPower|Power] to nearby rooms, increasing in distance with Room tier"
      ],
      "mechanicSource": {
        "acceptedSources": [
          "ggpk_dat_exports",
          "schema_min_json",
          "official_patch_notes",
          "live_observations"
        ],
        "excludedSources": [
          "third_party_frontend_source"
        ],
        "ggpkUpgradeStatus": "ggpk_source_set_confirmed_semantics_local",
        "upgradeSources": {
          "ggpk": [
            "sacrificial_chamber",
            "thaumaturge"
          ],
          "local": [
            "sacrificial_chamber",
            "thaumaturge"
          ],
          "missingFromLocal": [],
          "extraInLocal": []
        },
        "upgradeSemantics": "source_set_ggpk_confirmed_semantics_local",
        "powerTier": "none"
      }
    },
    {
      "id": "spymaster",
      "name_zh": "密探",
      "name_en": "Spymaster",
      "category": "utility",
      "tierChain": [
        "Spymaster's Study",
        "Hall of Shadows",
        "Omnipresent Panopticon",
        "Espionage Core"
      ],
      "maxTier": 4,
      "t4Unlockable": true,
      "needsPower": false,
      "powerCount": 0,
      "snakeRole": "critical",
      "oneShot": false,
      "fixedSlot": false,
      "destabiliseEligible": true,
      "valueClass": "very-high",
      "medallionDrops": {
        "1": ["juatalotli", "quipolatl", "uromoti"],
        "2": ["juatalotli", "quipolatl", "uromoti"],
        "3": ["juatalotli", "uromoti", "puhuarte"],
        "4": ["juatalotli", "uromoti", "puhuarte"]
      },
      "medallionDropsSource": "GGPK Incursion2RoomPerLevel.Description2 一手解码 2026-06-03",
      "drops": [
        "juatalotli_medallion"
      ],
      "amplifies": [
        "generator",
        "synthflesh_lab",
        "flesh_surgeon",
        "transcendent_barracks",
        "alchemy_lab"
      ],
      "amplifyRangeByTier": [
        3,
        4,
        5,
        6
      ],
      "amplifyMultByTier": [
        1.08,
        1.15,
        1.3,
        1.4
      ],
      "modBonus": [
        {
          "stat": "mod_amp_lab_family",
          "byTier": [
            8,
            15,
            30,
            40
          ],
          "source": "unpacked:Incursion2RoomPerLevel.ModValues"
        }
      ],
      "t3Special": "adds_unchained_beast",
      "notConnectableInChainWith": [
        "commander"
      ],
      "notes": "Snake 三件套灵魂。击杀掉 Juatalotli's Medallion(锁定纹章),贴在链末端房间防瓦解。**放大家族 2026-06-03 一手解包定论;Spymaster=实验室组**:T1/T2/T3 = 8/15/30%(T4=40%)放大「实验室家族」(Generator/Synthflesh Lab/Flesh Surgeon/Transcendent Barracks/Alchemy Lab)的 Temple Mod 效果。来源:map_temple_room_stat_descriptions.csd 里 Spymaster 房携带的 stat(index 24747)tooltip 原文逐字列出这 5 房 + temple_mods.json 用 boss 包(ChainedBeast=Spymaster)锚定房归属。「stat 名错位」(Spymaster 房带名为 golemworks 的 stat)只坑机械名字匹配,tooltip 原文才是真相。(此前据 poe2wiki/poe2db 反复对调均非可信源;poe2db 实测不列家族清单。)**放置限制(poe2wiki line 382, 788)**:Spymaster 不能放在已含 Commander 的线性链(snake)中。**升级机制(poe2wiki line 786)**:暗杀升级 — 神庙内 ≥2 个 Spymaster 时,开门时一个可塌陷的被「暗杀」(自动完成、清空格子),关门时另一个 Spymaster tier +1。每个 Spymaster 一生只能被这样升 1 次。**T4(Espionage Core,0.5)**:放大倍率 40%(×1.40)。放大范围格数 [3,4,5,6] 是社区(poe2temple.blog)数、非 GGPK、待实测。GGPK ModValues[40,1] 第二值(T1/T2=0、T3/T4=1)是 T3+ 生成 boss 怪包的标志、**不是范围**。T3+ 额外生成一组 ChainedBeast Boss 怪包(stat map_monster_additional_incursion_ChainedBeastBoss_packs=1)。",
      "unpackedId": "ViperSpymaster",
      "unpackedRoomIndex": 8,
      "unpackedName": "Spymaster",
      "unpackedFlags": {
        "isPathway": false,
        "isPresentDay": false,
        "isBossReward": false,
        "upgradedByPower": 0
      },
      "unpackedLevels": [
        {
          "level": 1,
          "id": "viperspymaster_lvl1",
          "name": "Spymaster's Study",
          "mod": 15156,
          "modValues": [
            8,
            0
          ],
          "description": "Room Tier can be increased by defeating other Spymasters",
          "description2": "May drop [IncursionMedallionPreventDestabilise|Juatalotli's Medallion], [IncursionMedallionIncreaseRoomTier|Quipolatl's Medallion] or [IncursionMedallionAddRoom|Uromoti's Medallion]"
        },
        {
          "level": 2,
          "id": "viperspymaster_lvl2",
          "name": "Hall of Shadows",
          "mod": 15156,
          "modValues": [
            15,
            0
          ],
          "description": "Room Tier can be increased by defeating other Spymasters",
          "description2": "May drop [IncursionMedallionPreventDestabilise|Juatalotli's Medallion], [IncursionMedallionIncreaseRoomTier|Quipolatl's Medallion] or [IncursionMedallionAddRoom|Uromoti's Medallion]"
        },
        {
          "level": 3,
          "id": "viperspymaster_lvl3",
          "name": "Omnipresent Panopticon",
          "mod": 15156,
          "modValues": [
            30,
            1
          ],
          "description": "Room Tier can be increased by defeating other Spymasters",
          "description2": "May drop [IncursionMedallionPreventDestabilise|Juatalotli's Medallion], [IncursionMedallionAddRoom|Uromoti's Medallion] or [IncursionMedallionRerollRoomCards|Puhuarte's Medallion]"
        },
        {
          "level": 4,
          "id": "viperspymaster_lvl4",
          "name": "Espionage Core",
          "mod": 15156,
          "modValues": [
            40,
            1
          ],
          "description": "",
          "description2": "May drop [IncursionMedallionPreventDestabilise|Juatalotli's Medallion], [IncursionMedallionAddRoom|Uromoti's Medallion] or [IncursionMedallionRerollRoomCards|Puhuarte's Medallion]"
        }
      ],
      "dataSource": {
        "unpacked": "Content.ggpk:data/balance/incursion2*.datc64",
        "unpackedAt": "2026-06-01"
      },
      "clientDescription": [
        "Room Tier can be increased by defeating other Spymasters"
      ],
      "clientDropText": [
        "May drop [IncursionMedallionPreventDestabilise|Juatalotli's Medallion], [IncursionMedallionIncreaseRoomTier|Quipolatl's Medallion] or [IncursionMedallionAddRoom|Uromoti's Medallion]",
        "May drop [IncursionMedallionPreventDestabilise|Juatalotli's Medallion], [IncursionMedallionAddRoom|Uromoti's Medallion] or [IncursionMedallionRerollRoomCards|Puhuarte's Medallion]"
      ],
      "mechanicSource": {
        "acceptedSources": [
          "ggpk_dat_exports",
          "schema_min_json",
          "official_patch_notes",
          "live_observations"
        ],
        "excludedSources": [
          "third_party_frontend_source"
        ],
        "ggpkUpgradeStatus": "no_ggpk_upgrade_sources",
        "upgradeSources": {
          "ggpk": [],
          "local": [],
          "missingFromLocal": [],
          "extraInLocal": []
        },
        "upgradeSemantics": "no_tracked_ggpk_upgrade_rule",
        "powerTier": "none"
      }
    },
    {
      "id": "synthflesh_lab",
      "name_zh": "合成血肉实验室",
      "name_en": "Synthflesh Lab",
      "category": "craft",
      "tierChain": [
        "Prosthetic Research",
        "Synthflesh Sanctum",
        "Crucible of Transcendence",
        "Supremacy of Function"
      ],
      "maxTier": 4,
      "t4Unlockable": true,
      "needsPower": true,
      "powerCount": 1,
      "snakeRole": "filler",
      "oneShot": false,
      "fixedSlot": false,
      "destabiliseEligible": true,
      "valueClass": "high",
      "upgradeAdjacency": {
        "2": {
          "rooms": [
            "flesh_surgeon"
          ],
          "count": 1
        },
        "3": {
          "rooms": [
            "flesh_surgeon"
          ],
          "count": 1,
          "requiresPower": true
        }
      },
      "modBonus": [
        {
          "stat": "experience",
          "byTier": [
            10,
            20,
            40,
            60
          ],
          "source": "unpacked:Incursion2RoomPerLevel.ModValues"
        }
      ],
      "notes": "需供能。**poe2db**:T1/T2/T3 experience gain +10/20/40%。**升级邻接(poe2wiki line 820)**:T2 = Flesh Surgeon 邻接;T3 = Flesh Surgeon 邻接 **+ Generator 供能**(requiresPower)。先前 count:2 Surgeon 解读错误 — 实际只需 1 个 + Power。**GGPK 语义(2026-06 schema 核对)**:Incursion2Rooms 无 count/requireAll/minTier/requiresPower 字段;升级源由 GGPK UpgradedBy=[FleshSurgeon] + UpgradedByPower=1 确认,count=1/requiresPower 为本地模型语义,数量/供能门槛待官方或实测复核。",
      "unpackedId": "SynthfleshLab",
      "unpackedRoomIndex": 10,
      "unpackedName": "Synthflesh Lab",
      "unpackedFlags": {
        "isPathway": false,
        "isPresentDay": false,
        "isBossReward": false,
        "upgradedByPower": 1
      },
      "unpackedLevels": [
        {
          "level": 1,
          "id": "synthfleshlab_lvl1",
          "name": "Prosthetic Research",
          "mod": 14916,
          "modValues": [
            10
          ],
          "description": "",
          "description2": ""
        },
        {
          "level": 2,
          "id": "synthfleshlab_lvl2",
          "name": "Synthflesh Sanctum",
          "mod": 14916,
          "modValues": [
            20
          ],
          "description": "",
          "description2": ""
        },
        {
          "level": 3,
          "id": "synthfleshlab_lvl3",
          "name": "Crucible of Transcendence",
          "mod": 14916,
          "modValues": [
            40
          ],
          "description": "",
          "description2": ""
        },
        {
          "level": 4,
          "id": "synthfleshlab_lvl4",
          "name": "Supremacy of Function",
          "mod": 14916,
          "modValues": [
            60
          ],
          "description": "",
          "description2": ""
        }
      ],
      "dataSource": {
        "unpacked": "Content.ggpk:data/balance/incursion2*.datc64",
        "unpackedAt": "2026-06-01"
      },
      "mechanicSource": {
        "acceptedSources": [
          "ggpk_dat_exports",
          "schema_min_json",
          "official_patch_notes",
          "live_observations"
        ],
        "excludedSources": [
          "third_party_frontend_source"
        ],
        "ggpkUpgradeStatus": "ggpk_source_set_confirmed_semantics_local",
        "upgradeSources": {
          "ggpk": [
            "flesh_surgeon"
          ],
          "local": [
            "flesh_surgeon"
          ],
          "missingFromLocal": [],
          "extraInLocal": []
        },
        "upgradeSemantics": "source_set_ggpk_confirmed_semantics_local",
        "powerTier": "ggpk_power_flag_present_semantics_local"
      }
    },
    {
      "id": "flesh_surgeon",
      "name_zh": "血肉医师",
      "name_en": "Flesh Surgeon",
      "category": "utility",
      "tierChain": [
        "Surgeon's Ward",
        "Surgeon's Theatre",
        "Surgeon's Symphony",
        "Surgical Glory"
      ],
      "maxTier": 4,
      "t4Unlockable": true,
      "needsPower": false,
      "powerCount": 0,
      "snakeRole": "filler",
      "oneShot": false,
      "fixedSlot": false,
      "destabiliseEligible": true,
      "valueClass": "high",
      "medallionDrops": {
        "1": ["quipolatl", "uromoti"],
        "2": ["quipolatl", "uromoti"],
        "3": ["juatalotli", "hayoxi", "uromoti", "estazunti", "zantipi"],
        "4": ["juatalotli", "hayoxi", "uromoti", "estazunti", "zantipi"]
      },
      "medallionDropsSource": "GGPK Incursion2RoomPerLevel.Description2 一手解码 2026-06-03",
      "upgradeAdjacency": {
        "2": {
          "rooms": [
            "synthflesh_lab"
          ],
          "count": 1,
          "minTier": 2
        },
        "3": {
          "rooms": [
            "synthflesh_lab"
          ],
          "count": 1,
          "minTier": 3
        }
      },
      "modBonus": [
        {
          "stat": "unique_effectiveness",
          "byTier": [
            10,
            20,
            40,
            60
          ],
          "source": "unpacked:Incursion2RoomPerLevel.ModValues"
        }
      ],
      "t3Special": "limb_modification",
      "notes": "改造怪物 / 增强奖励。**poe2db**:T1/T2/T3 unique monster effectiveness +10/20/40%;T3 含 Limb Modification(Transcension Device)。升级来源由 GGPK Incursion2Rooms.UpgradedBy=SynthfleshLab 确认。**升级 = tier 跟随相邻最高 Synthflesh Lab(游戏内「房间升级」tooltip 原文:血肉外科醫師的房间等级会同于相邻最高等级的合膚實驗室);建模为门槛 minTier=目标tier(T2 需 synth≥T2、T3 需 synth≥T3,即 flesh tier ≤ 相邻 synth tier)。2026-06-03 据 tooltip 把旧的本地推导 minTier(偏低一档,允许 flesh 超过 synth)纠正对齐。**",
      "unpackedId": "FleshSurgeon",
      "unpackedRoomIndex": 11,
      "unpackedName": "Flesh Surgeon",
      "unpackedFlags": {
        "isPathway": false,
        "isPresentDay": false,
        "isBossReward": false,
        "upgradedByPower": 0
      },
      "unpackedLevels": [
        {
          "level": 1,
          "id": "fleshsurgeon_lvl1",
          "name": "Surgeon's Ward",
          "mod": 14917,
          "modValues": [
            10
          ],
          "description": "",
          "description2": "May drop [IncursionMedallionIncreaseRoomTier|Quipolatl's Medallion] or [IncursionMedallionAddRoom|Uromoti's Medallion]"
        },
        {
          "level": 2,
          "id": "fleshsurgeon_lvl2",
          "name": "Surgeon's Theatre",
          "mod": 14917,
          "modValues": [
            20
          ],
          "description": "",
          "description2": "May drop [IncursionMedallionIncreaseRoomTier|Quipolatl's Medallion] or [IncursionMedallionAddRoom|Uromoti's Medallion]"
        },
        {
          "level": 3,
          "id": "fleshsurgeon_lvl3",
          "name": "Surgeon's Symphony",
          "mod": 14917,
          "modValues": [
            40
          ],
          "description": "Contains the Transcension Device, allowing for [IncursionLimbModification|Limb Modification]",
          "description2": "May drop [IncursionMedallionPreventDestabilise|Juatalotli's Medallion], [IncursionMedallionRerollRestrictedRoom|Hayoxi's Medallion], [IncursionMedallionAddRoom|Uromoti's Medallion], [IncursionMedallionAddAdditionalRestrictedRoom|Estazunti's Medallion] or [IncursionMedallionAddTempleModifier|Zantipi's Medallion]"
        },
        {
          "level": 4,
          "id": "fleshsurgeon_lvl4",
          "name": "Surgical Glory",
          "mod": 14917,
          "modValues": [
            60
          ],
          "description": "Contains the Transcension Device, allowing for [IncursionLimbModification|Limb Modification], which can be used twice",
          "description2": "May drop [IncursionMedallionPreventDestabilise|Juatalotli's Medallion], [IncursionMedallionRerollRestrictedRoom|Hayoxi's Medallion], [IncursionMedallionAddRoom|Uromoti's Medallion], [IncursionMedallionAddAdditionalRestrictedRoom|Estazunti's Medallion] or [IncursionMedallionAddTempleModifier|Zantipi's Medallion]"
        }
      ],
      "dataSource": {
        "unpacked": "Content.ggpk:data/balance/incursion2*.datc64",
        "unpackedAt": "2026-06-01"
      },
      "clientDescription": [
        "Contains the Transcension Device, allowing for [IncursionLimbModification|Limb Modification]",
        "Contains the Transcension Device, allowing for [IncursionLimbModification|Limb Modification], which can be used twice"
      ],
      "clientDropText": [
        "May drop [IncursionMedallionIncreaseRoomTier|Quipolatl's Medallion] or [IncursionMedallionAddRoom|Uromoti's Medallion]",
        "May drop [IncursionMedallionPreventDestabilise|Juatalotli's Medallion], [IncursionMedallionRerollRestrictedRoom|Hayoxi's Medallion], [IncursionMedallionAddRoom|Uromoti's Medallion], [IncursionMedallionAddAdditionalRestrictedRoom|Estazunti's Medallion] or [IncursionMedallionAddTempleModifier|Zantipi's Medallion]"
      ],
      "mechanicSource": {
        "acceptedSources": [
          "ggpk_dat_exports",
          "schema_min_json",
          "official_patch_notes",
          "live_observations"
        ],
        "excludedSources": [
          "third_party_frontend_source"
        ],
        "ggpkUpgradeStatus": "ggpk_source_set_confirmed_semantics_local",
        "upgradeSources": {
          "ggpk": [
            "synthflesh_lab"
          ],
          "local": [
            "synthflesh_lab"
          ],
          "missingFromLocal": [],
          "extraInLocal": []
        },
        "upgradeSemantics": "source_set_ggpk_confirmed_semantics_local",
        "powerTier": "none"
      }
    },
    {
      "id": "transcendent_barracks",
      "name_zh": "升华守卫兵营",
      "name_en": "Transcendent Barracks",
      "category": "utility",
      "tierChain": [
        "Transcendent Barracks T1",
        "Steelflesh Quarters",
        "Collective Legion",
        "Chamber of the Perfected"
      ],
      "maxTier": 4,
      "t4Unlockable": true,
      "needsPower": true,
      "powerCount": 1,
      "snakeRole": "filler",
      "oneShot": false,
      "fixedSlot": false,
      "destabiliseEligible": true,
      "valueClass": "high",
      "transformsFrom": "garrison",
      "upgradeAdjacency": {
        "3": {
          "rooms": [
            "synthflesh_lab"
          ],
          "count": 1,
          "requiresPower": true
        }
      },
      "modBonus": [
        {
          "stat": "magic_monster_count",
          "byTier": [
            0,
            25,
            50,
            75
          ],
          "source": "unpacked:Incursion2RoomPerLevel.ModValues"
        }
      ],
      "notes": "**转换来源(GGPK Incursion2Rooms.ConvertedBy/ConvertedTo 坐实)**:Garrison(idx3) ConvertedBy=[Synthflesh(10), Spymaster(8)] → ConvertedTo=[Transcendent(12), Legion(9)],即 Garrison+Synthflesh→Transcendent、Garrison+Spymaster→Legion(本房由 Garrison 邻接 Synthflesh Lab 转换形成 → 直接到 T2,无 T1 状态)。T2 形成后**不会被 Synthflesh / Commander 邻接进一步升级**(GGPK Transcendent(idx12) UpgradedBy=[Synthflesh(10)] 为特殊机制,非邻接自动升,见 mechanicSource)。**T3 仅能用 Quipolatl 升阶纹章**(poe2wiki 876:\"A Medallion is required to upgrade to Tier 3\")。autoUpgradeAll **不应触发任何升级**,故 upgradeAdjacency 字段已删除。",
      "unpackedId": "TranscendentBarracks",
      "unpackedRoomIndex": 12,
      "unpackedName": "Transcendent Barracks",
      "unpackedFlags": {
        "isPathway": false,
        "isPresentDay": false,
        "isBossReward": false,
        "upgradedByPower": 1
      },
      "unpackedLevels": [
        {
          "level": 2,
          "id": "transcendentbarracks_lvl2",
          "name": "Steelflesh Quarters",
          "mod": 14918,
          "modValues": [
            25
          ],
          "description": "",
          "description2": ""
        },
        {
          "level": 3,
          "id": "transcendentbarracks_lvl3",
          "name": "Collective Legion",
          "mod": 14918,
          "modValues": [
            50
          ],
          "description": "",
          "description2": ""
        },
        {
          "level": 4,
          "id": "transcendentbarracks_lvl4",
          "name": "Chamber of the Perfected",
          "mod": 14918,
          "modValues": [
            75
          ],
          "description": "",
          "description2": ""
        }
      ],
      "dataSource": {
        "unpacked": "Content.ggpk:data/balance/incursion2*.datc64",
        "unpackedAt": "2026-06-01"
      },
      "mechanicSource": {
        "acceptedSources": [
          "ggpk_dat_exports",
          "schema_min_json",
          "official_patch_notes",
          "live_observations"
        ],
        "excludedSources": [
          "third_party_frontend_source"
        ],
        "ggpkUpgradeStatus": "ggpk_sources_unmodelled_or_special_case",
        "upgradeSources": {
          "ggpk": [
            "synthflesh_lab"
          ],
          "local": [],
          "missingFromLocal": [
            "synthflesh_lab"
          ],
          "extraInLocal": []
        },
        "upgradeSemantics": "ggpk_sources_special_case_not_auto_upgrade",
        "powerTier": "ggpk_power_flag_present_special_case"
      }
    },
    {
      "id": "legion_barrack",
      "name_zh": "军团兵营",
      "name_en": "Legion Barrack",
      "category": "utility",
      "tierChain": [
        "Legion Barrack",
        "Viper's Loyals",
        "Elite Legion",
        "Unmatched Legionnaires"
      ],
      "maxTier": 4,
      "t4Unlockable": true,
      "needsPower": false,
      "powerCount": 0,
      "snakeRole": "filler",
      "oneShot": false,
      "fixedSlot": false,
      "destabiliseEligible": true,
      "valueClass": "high",
      "medallionDrops": {
        "2": ["quipolatl", "uromoti"],
        "3": ["juatalotli", "hayoxi", "uromoti", "estazunti", "zantipi"],
        "4": ["juatalotli", "hayoxi", "uromoti", "estazunti", "zantipi"]
      },
      "medallionDropsSource": "GGPK Incursion2RoomPerLevel.Description2 一手解码 2026-06-03",
      "transformsFrom": "garrison",
      "upgradeAdjacency": {
        "2": {
          "rooms": [
            "armoury",
            "spymaster"
          ],
          "count": 1
        },
        "3": {
          "rooms": [
            "armoury",
            "spymaster"
          ],
          "count": 1
        }
      },
      "notConnectableTo": [
        "commander"
      ],
      "modBonus": [
        {
          "stat": "rare_monster_count",
          "byTier": [
            0,
            25,
            50,
            75
          ],
          "source": "unpacked:Incursion2RoomPerLevel.ModValues"
        }
      ],
      "notes": "**转换来源(GGPK Incursion2Rooms.ConvertedBy/ConvertedTo 坐实)**:Garrison(idx3) ConvertedBy=[Synthflesh(10), Spymaster(8)] → ConvertedTo=[Transcendent(12), Legion(9)],即 Garrison+Synthflesh→Transcendent、Garrison+Spymaster→Legion(本房由 Garrison 邻接 Spymaster 转换形成 → 直接到 T2)。**升级邻接(GGPK Incursion2Rooms.UpgradedBy=[Armoury(5), Spymaster(8)] 坐实)**:Legion 升 tier 需邻接 Armoury **或** Spymaster(任一即可,upgradeAdjacency.rooms=[armoury,spymaster] count=1 即 OR 语义)。先前 notes 误写「Spymaster 不算升级源」与 GGPK UpgradedBy 矛盾,已按 GGPK 订正(2026-06-02 本地 GGPK 一手核实)。**count=1 / requireAll 数量语义仍为本地推断**:GGPK Incursion2Rooms 无 count/requireAll/minTier 字段,「邻接 1 个升 1 tier」是本地建模,待官方或实测复核。**连接限制(poe2wiki line 850)**:Legion Barracks **不可连接 Commander**,转换形成时会自动切断已有的 Commander 连接。**Mod 数值(2026-06-02 poe2db 交叉验证)**:Legion Barracks = **Rare 怪数量** T2/T3/T4 = 25/50/75(stat rare_monster_count,GGPK mod 14915 ModValues L2/L3/L4=25/50/75 确认;byTier[0,25,50,75] 的 T1=0 仅占位,本房由 Garrison 转换直接到 T2)。**与 Transcendent Barracks 区分**:Transcendent = **Magic 怪数量** 25/50/75(stat magic_monster_count,mod 14918),两者数值同形但 stat 类型不同(Rare ≠ Magic),已是独立条目无需拆分。",
      "unpackedId": "ViperLegionBarracks",
      "unpackedRoomIndex": 9,
      "unpackedName": "Legion Barracks",
      "unpackedFlags": {
        "isPathway": false,
        "isPresentDay": false,
        "isBossReward": false,
        "upgradedByPower": 0
      },
      "unpackedLevels": [
        {
          "level": 2,
          "id": "viperlegionbarracks_lvl2",
          "name": "Viper's Loyals",
          "mod": 14915,
          "modValues": [
            25
          ],
          "description": "",
          "description2": "May drop [IncursionMedallionIncreaseRoomTier|Quipolatl's Medallion] or [IncursionMedallionAddRoom|Uromoti's Medallion]"
        },
        {
          "level": 3,
          "id": "viperlegionbarracks_lvl3",
          "name": "Elite Legion",
          "mod": 14915,
          "modValues": [
            50
          ],
          "description": "",
          "description2": "May drop [IncursionMedallionPreventDestabilise|Juatalotli's Medallion], [IncursionMedallionRerollRestrictedRoom|Hayoxi's Medallion], [IncursionMedallionAddRoom|Uromoti's Medallion], [IncursionMedallionAddAdditionalRestrictedRoom|Estazunti's Medallion] or [IncursionMedallionAddTempleModifier|Zantipi's Medallion]"
        },
        {
          "level": 4,
          "id": "viperlegionbarracks_lvl4",
          "name": "Unmatched Legionnaires",
          "mod": 14915,
          "modValues": [
            75
          ],
          "description": "",
          "description2": "May drop [IncursionMedallionPreventDestabilise|Juatalotli's Medallion], [IncursionMedallionRerollRestrictedRoom|Hayoxi's Medallion], [IncursionMedallionAddRoom|Uromoti's Medallion], [IncursionMedallionAddAdditionalRestrictedRoom|Estazunti's Medallion] or [IncursionMedallionAddTempleModifier|Zantipi's Medallion]"
        }
      ],
      "dataSource": {
        "unpacked": "Content.ggpk:data/balance/incursion2*.datc64",
        "unpackedAt": "2026-06-01"
      },
      "clientDropText": [
        "May drop [IncursionMedallionIncreaseRoomTier|Quipolatl's Medallion] or [IncursionMedallionAddRoom|Uromoti's Medallion]",
        "May drop [IncursionMedallionPreventDestabilise|Juatalotli's Medallion], [IncursionMedallionRerollRestrictedRoom|Hayoxi's Medallion], [IncursionMedallionAddRoom|Uromoti's Medallion], [IncursionMedallionAddAdditionalRestrictedRoom|Estazunti's Medallion] or [IncursionMedallionAddTempleModifier|Zantipi's Medallion]"
      ],
      "mechanicSource": {
        "acceptedSources": [
          "ggpk_dat_exports",
          "schema_min_json",
          "official_patch_notes",
          "live_observations"
        ],
        "excludedSources": [
          "third_party_frontend_source"
        ],
        "ggpkUpgradeStatus": "local_matches_ggpk_sources",
        "upgradeSources": {
          "ggpk": [
            "armoury",
            "spymaster"
          ],
          "local": [
            "armoury",
            "spymaster"
          ],
          "missingFromLocal": [],
          "extraInLocal": []
        },
        "upgradeSemantics": "ggpk_sources_matched_count_local_inferred",
        "powerTier": "none"
      }
    },
    {
      "id": "alchemy_lab",
      "name_zh": "炼金实验室",
      "name_en": "Alchemy Lab",
      "category": "craft",
      "tierChain": [
        "Chamber of Souls",
        "Core Machinarium",
        "Grand Phylactory",
        "Decorous Phylactory"
      ],
      "maxTier": 4,
      "t4Unlockable": true,
      "needsPower": false,
      "powerCount": 0,
      "snakeRole": "filler",
      "oneShot": false,
      "fixedSlot": false,
      "destabiliseEligible": true,
      "valueClass": "high",
      "medallionDrops": {
        "1": ["quipolatl", "uromoti"],
        "2": ["quipolatl", "uromoti"],
        "3": ["juatalotli", "hayoxi", "uromoti", "estazunti", "zantipi"],
        "4": ["juatalotli", "hayoxi", "uromoti", "estazunti", "zantipi"]
      },
      "medallionDropsSource": "GGPK Incursion2RoomPerLevel.Description2 一手解码 2026-06-03",
      "upgradeAdjacency": {
        "2": {
          "rooms": [
            "thaumaturge"
          ],
          "count": 1
        },
        "3": {
          "rooms": [
            "thaumaturge"
          ],
          "count": 2
        }
      },
      "modBonus": [
        {
          "stat": "item_rarity",
          "byTier": [
            10,
            25,
            50,
            75
          ],
          "source": "unpacked:Incursion2RoomPerLevel.ModValues"
        },
        {
          "stat": "gold",
          "byTier": [
            0,
            0,
            50,
            100
          ],
          "source": "unpacked:Incursion2RoomPerLevel.ModValues"
        }
      ],
      "t3Special": "core_destabiliser",
      "notes": "炼金产出。**poe2db**:T1/T2/T3 item rarity from monsters +15/30/60%;**T3 额外 +50% gold**;T3 有 Soul Core Infuser(Core Destabiliser)。T2 gold 加成未在当前 GGPK ModValues 中确认。升级来源由 GGPK Incursion2Rooms.UpgradedBy=Thaumaturge×2 确认;分级语义为本地模型推导。",
      "unpackedId": "AlchemyLab",
      "unpackedRoomIndex": 13,
      "unpackedName": "Alchemy Lab",
      "unpackedFlags": {
        "isPathway": false,
        "isPresentDay": false,
        "isBossReward": false,
        "upgradedByPower": 0
      },
      "unpackedLevels": [
        {
          "level": 1,
          "id": "alchemylab_lvl1",
          "name": "Chamber of Souls",
          "mod": 14919,
          "modValues": [
            10
          ],
          "description": "",
          "description2": "May drop [IncursionMedallionIncreaseRoomTier|Quipolatl's Medallion] or [IncursionMedallionAddRoom|Uromoti's Medallion]"
        },
        {
          "level": 2,
          "id": "alchemylab_lvl2",
          "name": "Core Machinarium",
          "mod": 14919,
          "modValues": [
            25
          ],
          "description": "",
          "description2": "May drop [IncursionMedallionIncreaseRoomTier|Quipolatl's Medallion] or [IncursionMedallionAddRoom|Uromoti's Medallion]"
        },
        {
          "level": 3,
          "id": "alchemylab_lvl3",
          "name": "Grand Phylactory",
          "mod": 14923,
          "modValues": [
            50,
            50
          ],
          "description": "Contains the Soul Core Infuser which can be used to modify [SoulCore|Soul Cores]\r\nRoom [IncursionDestabilization|Destabilises] once device is used",
          "description2": "May drop [IncursionMedallionPreventDestabilise|Juatalotli's Medallion], [IncursionMedallionRerollRestrictedRoom|Hayoxi's Medallion], [IncursionMedallionAddRoom|Uromoti's Medallion], [IncursionMedallionAddAdditionalRestrictedRoom|Estazunti's Medallion] or [IncursionMedallionAddTempleModifier|Zantipi's Medallion]"
        },
        {
          "level": 4,
          "id": "alchemylab_lvl4",
          "name": "Decorous Phylactory",
          "mod": 14923,
          "modValues": [
            75,
            100
          ],
          "description": "Contains the Soul Core Infuser which can be used to modify [SoulCore|Soul Cores]\r\nRoom [IncursionDestabilization|Destabilises] once device is used\r\n[Rarity|Unique] Boss drops additional Soul Cores",
          "description2": "May drop [IncursionMedallionPreventDestabilise|Juatalotli's Medallion], [IncursionMedallionRerollRestrictedRoom|Hayoxi's Medallion], [IncursionMedallionAddRoom|Uromoti's Medallion], [IncursionMedallionAddAdditionalRestrictedRoom|Estazunti's Medallion] or [IncursionMedallionAddTempleModifier|Zantipi's Medallion]"
        }
      ],
      "dataSource": {
        "unpacked": "Content.ggpk:data/balance/incursion2*.datc64",
        "unpackedAt": "2026-06-01"
      },
      "clientDescription": [
        "Contains the Soul Core Infuser which can be used to modify [SoulCore|Soul Cores] Room [IncursionDestabilization|Destabilises] once device is used",
        "Contains the Soul Core Infuser which can be used to modify [SoulCore|Soul Cores] Room [IncursionDestabilization|Destabilises] once device is used [Rarity|Unique] Boss drops additional Soul Cores"
      ],
      "clientDropText": [
        "May drop [IncursionMedallionIncreaseRoomTier|Quipolatl's Medallion] or [IncursionMedallionAddRoom|Uromoti's Medallion]",
        "May drop [IncursionMedallionPreventDestabilise|Juatalotli's Medallion], [IncursionMedallionRerollRestrictedRoom|Hayoxi's Medallion], [IncursionMedallionAddRoom|Uromoti's Medallion], [IncursionMedallionAddAdditionalRestrictedRoom|Estazunti's Medallion] or [IncursionMedallionAddTempleModifier|Zantipi's Medallion]"
      ],
      "mechanicSource": {
        "acceptedSources": [
          "ggpk_dat_exports",
          "schema_min_json",
          "official_patch_notes",
          "live_observations"
        ],
        "excludedSources": [
          "third_party_frontend_source"
        ],
        "ggpkUpgradeStatus": "ggpk_source_set_confirmed_semantics_local",
        "upgradeSources": {
          "ggpk": [
            "thaumaturge"
          ],
          "local": [
            "thaumaturge"
          ],
          "missingFromLocal": [],
          "extraInLocal": []
        },
        "upgradeSemantics": "source_set_ggpk_confirmed_semantics_local",
        "powerTier": "none"
      }
    },
    {
      "id": "thaumaturge",
      "name_zh": "奇术师",
      "name_en": "Thaumaturge",
      "category": "craft",
      "tierChain": [
        "Thaumaturge's Laboratory",
        "Thaumaturge's Cuttery",
        "Thaumaturge's Cathedral",
        "Thaumaturge's Culmination"
      ],
      "maxTier": 4,
      "t4Unlockable": true,
      "needsPower": false,
      "powerCount": 0,
      "snakeRole": "filler",
      "oneShot": false,
      "fixedSlot": false,
      "destabiliseEligible": true,
      "valueClass": "high",
      "medallionDrops": {
        "1": ["quipolatl", "uromoti"],
        "2": ["quipolatl", "uromoti"],
        "3": ["juatalotli", "hayoxi", "uromoti", "estazunti", "puhuarte"],
        "4": ["juatalotli", "hayoxi", "uromoti", "estazunti", "puhuarte"]
      },
      "medallionDropsSource": "GGPK Incursion2RoomPerLevel.Description2 一手解码 2026-06-03",
      "upgradeAdjacency": {
        "2": {
          "rooms": [
            "sacrificial_chamber"
          ],
          "count": 1,
          "minTier": 2
        },
        "3": {
          "rooms": [
            "sacrificial_chamber"
          ],
          "count": 1,
          "minTier": 3
        }
      },
      "amplifies": [
        "corruption_chamber",
        "sacrificial_chamber",
        "vault",
        "ancient_reliquary_vault",
        "kishara_vault",
        "jiquani_vault",
        "currency_vault",
        "gem_vault",
        "augment_vault",
        "tablet_vault",
        "unique_vault",
        "sealed_vault"
      ],
      "amplifyRangeByTier": [
        3,
        4,
        5,
        6
      ],
      "amplifyMultByTier": [
        1.08,
        1.15,
        1.3,
        1.4
      ],
      "modBonus": [
        {
          "stat": "mod_amp_magic_family",
          "byTier": [
            8,
            15,
            30,
            40
          ],
          "source": "unpacked:Incursion2RoomPerLevel.ModValues"
        }
      ],
      "t3Special": "crystallised_corruption",
      "notes": "宝石/魂石相关产出。**poe2db**:T1/T2/T3 = 8/15/30% 放大「magic 家族」(Corruption / Vault / Sacrifice)的 Temple Mod 效果;T3 有 Gem Corrupter + Quadrilla Sergeant + Crystallised Corruption。**升级机制(游戏内「房间升级」tooltip 原文确认 2026-06-03)**:奇術師的房间等级会等于相邻最高等级的獻祭之室 → thaum tier = 相邻最高 Sacrificial Chamber tier(镜像)。建模为门槛 minTier=目标tier(T2 需 Sac≥T2、T3 需 Sac≥T3),与镜像等价(thaum tier ≤ 相邻 Sac tier)。升级源 GGPK UpgradedBy=[SacrificialChamber] 确认。**2026-05-18 11.5 round bug fix**:加 amplifies 列表(对应 mod_amp_magic_family 实际作用目标),之前漏了导致 Thaum 放大魔法家族不生效。**T4(Thaumaturge's Culmination,0.5)**:放大倍率 40%(×1.40),放大范围 6 格。T3+ 额外生成一组 SoulCoreQuadrilla Boss 怪包。**放大对象 = 奥术组(2026-06-03 .csd 解包定论)**:map_temple_room_stat_descriptions.csd 里 stat 24748(thaum 房携带)tooltip 原文 = 「Corruption Chambers, Treasure Vaults, and Sacrificial Chambers」(奥术组)。⚠ 旧 note 曾记「IDA 24748 分支 → 实验室组,与 arcane 矛盾」——那是地址漂移期的 off-by-one 误读(.csd 里 24747=实验室/24748=奥术,差一档);三组 stat(24746 战斗/24747 实验室/24748 奥术)无重叠且覆盖全部 13 产出房(5+5+3),完整自洽。待 IDA 重连复核 loot 函数 stat 分支以彻底闭环。",
      "unpackedId": "Thaumaturge",
      "unpackedRoomIndex": 14,
      "unpackedName": "Thaumaturge",
      "unpackedFlags": {
        "isPathway": false,
        "isPresentDay": true,
        "isBossReward": false,
        "upgradedByPower": 0
      },
      "unpackedLevels": [
        {
          "level": 1,
          "id": "thaumaturge_lvl1",
          "name": "Thaumaturge's Laboratory",
          "mod": 15158,
          "modValues": [
            8,
            0
          ],
          "description": "",
          "description2": "May drop [IncursionMedallionIncreaseRoomTier|Quipolatl's Medallion] or [IncursionMedallionAddRoom|Uromoti's Medallion]"
        },
        {
          "level": 2,
          "id": "thaumaturge_lvl2",
          "name": "Thaumaturge's Cuttery",
          "mod": 15158,
          "modValues": [
            15,
            0
          ],
          "description": "Contains the Gemcutting Mechanism which can be used to increase the [Quality] of a Skill Gem",
          "description2": "May drop [IncursionMedallionIncreaseRoomTier|Quipolatl's Medallion] or [IncursionMedallionAddRoom|Uromoti's Medallion]"
        },
        {
          "level": 3,
          "id": "thaumaturge_lvl3",
          "name": "Thaumaturge's Cathedral",
          "mod": 15158,
          "modValues": [
            30,
            1
          ],
          "description": "Contains the Gem Corrupter which can be used to modify a [Corrupted] Skill Gem unpredictably\r\nRoom [IncursionDestabilization|Destabilises] once device is used",
          "description2": "May drop [IncursionMedallionPreventDestabilise|Juatalotli's Medallion], [IncursionMedallionRerollRestrictedRoom|Hayoxi's Medallion], [IncursionMedallionAddRoom|Uromoti's Medallion], [IncursionMedallionAddAdditionalRestrictedRoom|Estazunti's Medallion] or [IncursionMedallionRerollRoomCards|Puhuarte's Medallion]"
        },
        {
          "level": 4,
          "id": "thaumaturge_lvl4",
          "name": "Thaumaturge's Culmination",
          "mod": 15158,
          "modValues": [
            40,
            1
          ],
          "description": "Contains the Gem Corrupter which can be used to modify a [Corrupted] Skill Gem unpredictably\r\nRoom [IncursionDestabilization|Destabilises] once device is used",
          "description2": "May drop [IncursionMedallionPreventDestabilise|Juatalotli's Medallion], [IncursionMedallionRerollRestrictedRoom|Hayoxi's Medallion], [IncursionMedallionAddRoom|Uromoti's Medallion], [IncursionMedallionAddAdditionalRestrictedRoom|Estazunti's Medallion] or [IncursionMedallionRerollRoomCards|Puhuarte's Medallion]"
        }
      ],
      "dataSource": {
        "unpacked": "Content.ggpk:data/balance/incursion2*.datc64",
        "unpackedAt": "2026-06-01"
      },
      "clientDescription": [
        "Contains the Gemcutting Mechanism which can be used to increase the [Quality] of a Skill Gem",
        "Contains the Gem Corrupter which can be used to modify a [Corrupted] Skill Gem unpredictably Room [IncursionDestabilization|Destabilises] once device is used"
      ],
      "clientDropText": [
        "May drop [IncursionMedallionIncreaseRoomTier|Quipolatl's Medallion] or [IncursionMedallionAddRoom|Uromoti's Medallion]",
        "May drop [IncursionMedallionPreventDestabilise|Juatalotli's Medallion], [IncursionMedallionRerollRestrictedRoom|Hayoxi's Medallion], [IncursionMedallionAddRoom|Uromoti's Medallion], [IncursionMedallionAddAdditionalRestrictedRoom|Estazunti's Medallion] or [IncursionMedallionRerollRoomCards|Puhuarte's Medallion]"
      ],
      "mechanicSource": {
        "acceptedSources": [
          "ggpk_dat_exports",
          "schema_min_json",
          "official_patch_notes",
          "live_observations"
        ],
        "excludedSources": [
          "third_party_frontend_source"
        ],
        "ggpkUpgradeStatus": "ggpk_source_set_confirmed_semantics_local",
        "upgradeSources": {
          "ggpk": [
            "sacrificial_chamber"
          ],
          "local": [
            "sacrificial_chamber"
          ],
          "missingFromLocal": [],
          "extraInLocal": []
        },
        "upgradeSemantics": "source_set_ggpk_confirmed_semantics_local",
        "powerTier": "none"
      }
    },
    {
      "id": "golem_works",
      "name_zh": "魔像工坊",
      "name_en": "Golem Works",
      "category": "craft",
      "tierChain": [
        "Workshop",
        "Automaton Lab",
        "Stone Legion",
        "Precision of Science"
      ],
      "maxTier": 4,
      "t4Unlockable": true,
      "needsPower": true,
      "powerCount": 2,
      "snakeRole": "filler",
      "oneShot": false,
      "fixedSlot": false,
      "destabiliseEligible": true,
      "valueClass": "very-high",
      "medallionDrops": {
        "1": ["quipolatl", "uromoti"],
        "2": ["quipolatl", "uromoti"],
        "3": ["quipolatl", "uromoti", "puhuarte"],
        "4": ["quipolatl", "uromoti", "puhuarte"]
      },
      "medallionDropsSource": "GGPK Incursion2RoomPerLevel.Description2 一手解码 2026-06-03",
      "amplifies": [
        "garrison",
        "commander",
        "armoury",
        "smithy",
        "legion_barrack"
      ],
      "amplifyRangeByTier": [
        3,
        4,
        5,
        6
      ],
      "amplifyMultByTier": [
        1.08,
        1.15,
        1.3,
        1.4
      ],
      "modBonus": [
        {
          "stat": "mod_amp_combat_family",
          "byTier": [
            8,
            15,
            30,
            40
          ],
          "source": "unpacked:Incursion2RoomPerLevel.ModValues"
        }
      ],
      "t3Special": "adds_royal_sentinel",
      "powerTier": {
        "source": "generator",
        "maxStack": 2
      },
      "notes": "需 2 个发电机。**放大家族 2026-06-03 一手解包定论;Golem Works=战斗组**:T1/T2/T3 = 8/15/30%(T4=40%)放大「战斗家族」(Garrison/Commander/Armoury/Smithy/Legion Barracks)的 Temple Mod 效果。来源:map_temple_room_stat_descriptions.csd 里 Golem Works 房携带的 stat(index 24746)tooltip 原文逐字列出这 5 房 + temple_mods.json 用 boss 包(VaalSentinel=Golem)锚定房归属。(此前据 poe2wiki/poe2db 反复对调均非可信源。)**升级机制(poe2wiki line 525)**:Generator (Power) → T2 / Generator (Power) x2 → T3。无邻接升级,每个范围内可达 Generator 给 +1 tier,最多叠 2 个。**T4(Precision of Science,0.5)**:放大倍率 40%(×1.40),放大范围 6 格。T3+ 额外生成一组 VaalSentinel Boss 怪包。**升级邻接(GGPK 0.5 确认)**:UpgradedBy=[] 且 UpgradedByPower=2,即不需任何房间邻接,只需 ≥2 个 Power 供能(≥2 Generator 辐射到)。社区说[需要 Generator 邻接]是对[需供电]的通俗表述,非硬邻接要求。",
      "unpackedId": "GolemWorks",
      "unpackedRoomIndex": 15,
      "unpackedName": "Golem Works",
      "unpackedFlags": {
        "isPathway": false,
        "isPresentDay": true,
        "isBossReward": false,
        "upgradedByPower": 2
      },
      "unpackedLevels": [
        {
          "level": 1,
          "id": "golemworks_lvl1",
          "name": "Workshop",
          "mod": 15157,
          "modValues": [
            8,
            0
          ],
          "description": "",
          "description2": "May drop [IncursionMedallionIncreaseRoomTier|Quipolatl's Medallion] or [IncursionMedallionAddRoom|Uromoti's Medallion]"
        },
        {
          "level": 2,
          "id": "golemworks_lvl2",
          "name": "Automaton Lab",
          "mod": 15157,
          "modValues": [
            15,
            0
          ],
          "description": "",
          "description2": "May drop [IncursionMedallionIncreaseRoomTier|Quipolatl's Medallion] or [IncursionMedallionAddRoom|Uromoti's Medallion]"
        },
        {
          "level": 3,
          "id": "golemworks_lvl3",
          "name": "Stone Legion",
          "mod": 15157,
          "modValues": [
            30,
            1
          ],
          "description": "",
          "description2": "May drop [IncursionMedallionIncreaseRoomTier|Quipolatl's Medallion], [IncursionMedallionAddRoom|Uromoti's Medallion] or [IncursionMedallionRerollRoomCards|Puhuarte's Medallion]"
        },
        {
          "level": 4,
          "id": "golemworks_lvl4",
          "name": "Precision of Science",
          "mod": 15157,
          "modValues": [
            40,
            1
          ],
          "description": "",
          "description2": "May drop [IncursionMedallionIncreaseRoomTier|Quipolatl's Medallion], [IncursionMedallionAddRoom|Uromoti's Medallion] or [IncursionMedallionRerollRoomCards|Puhuarte's Medallion]"
        }
      ],
      "dataSource": {
        "unpacked": "Content.ggpk:data/balance/incursion2*.datc64",
        "unpackedAt": "2026-06-01"
      },
      "clientDescription": [
        "May contain a bench allowing modification of [Equipment]"
      ],
      "clientDropText": [
        "May drop [IncursionMedallionIncreaseRoomTier|Quipolatl's Medallion] or [IncursionMedallionAddRoom|Uromoti's Medallion]",
        "May drop [IncursionMedallionIncreaseRoomTier|Quipolatl's Medallion], [IncursionMedallionAddRoom|Uromoti's Medallion] or [IncursionMedallionRerollRoomCards|Puhuarte's Medallion]"
      ],
      "mechanicSource": {
        "acceptedSources": [
          "ggpk_dat_exports",
          "schema_min_json",
          "official_patch_notes",
          "live_observations"
        ],
        "excludedSources": [
          "third_party_frontend_source"
        ],
        "ggpkUpgradeStatus": "ggpk_power_tier_confirmed",
        "upgradeSources": {
          "ggpk": [],
          "local": [],
          "missingFromLocal": [],
          "extraInLocal": []
        },
        "upgradeSemantics": "ggpk_power_tier_confirmed",
        "powerTier": "ggpk_upgraded_by_power_confirmed"
      }
    },
    {
      "id": "corruption_chamber",
      "name_zh": "腐化之室",
      "name_en": "Corruption Chamber",
      "category": "craft",
      "tierChain": [
        "Crimson Hall",
        "Catalyst of Corruption",
        "Locus of Corruption",
        "Rapture of Corruption"
      ],
      "maxTier": 4,
      "t4Unlockable": true,
      "needsPower": false,
      "powerCount": 0,
      "snakeRole": "filler",
      "oneShot": false,
      "fixedSlot": false,
      "destabiliseEligible": true,
      "valueClass": "very-high",
      "upgradeAdjacency": {
        "2": {
          "rooms": [
            "sacrificial_chamber",
            "thaumaturge"
          ],
          "count": 1
        },
        "3": {
          "rooms": [
            "sacrificial_chamber",
            "thaumaturge"
          ],
          "count": 2
        }
      },
      "modBonus": [
        {
          "stat": "rare_extra_mod_chance",
          "byTier": [
            10,
            25,
            50,
            75
          ],
          "source": "unpacked:Incursion2RoomPerLevel.ModValues"
        }
      ],
      "t3Special": "corrupted_abomination",
      "notes": "腐化物品。**不**需供能。**poe2db**:T1/T2/T3 = 15/30/60% 概率让 Rare 怪多 1 词条;T3 添加 Corrupted Abomination。升级来源由 GGPK Incursion2Rooms.UpgradedBy=Thaumaturge/SacrificialChamber 确认;分级语义为本地模型推导。",
      "unpackedId": "Corruption",
      "unpackedRoomIndex": 16,
      "unpackedName": "Corruption Chamber",
      "unpackedFlags": {
        "isPathway": false,
        "isPresentDay": true,
        "isBossReward": false,
        "upgradedByPower": 0
      },
      "unpackedLevels": [
        {
          "level": 1,
          "id": "corruption_lvl1",
          "name": "Crimson Hall",
          "mod": 14922,
          "modValues": [
            10,
            0
          ],
          "description": "Contains a Corruption Altar which can be used to [Corrupted|Corrupt] items",
          "description2": ""
        },
        {
          "level": 2,
          "id": "corruption_lvl2",
          "name": "Catalyst of Corruption",
          "mod": 14922,
          "modValues": [
            25,
            0
          ],
          "description": "Contains a Corruption Altar which can be used to [Corrupted|Corrupt] items",
          "description2": ""
        },
        {
          "level": 3,
          "id": "corruption_lvl3",
          "name": "Locus of Corruption",
          "mod": 14922,
          "modValues": [
            50,
            1
          ],
          "description": "Contains a Corruption Altar which can be used to modify [Corrupted] [Equipment] or Jewels unpredictably\r\nRoom [IncursionDestabilization|Destabilises] once device is used",
          "description2": ""
        },
        {
          "level": 4,
          "id": "corruption_lvl4",
          "name": "Rapture of Corruption",
          "mod": 14922,
          "modValues": [
            75,
            1
          ],
          "description": "Contains a Corruption Altar which can be used to modify [Corrupted] [Equipment] or Jewels unpredictably\r\nRoom [IncursionDestabilization|Destabilises] once device is used",
          "description2": ""
        }
      ],
      "dataSource": {
        "unpacked": "Content.ggpk:data/balance/incursion2*.datc64",
        "unpackedAt": "2026-06-01"
      },
      "clientDescription": [
        "Contains a Corruption Altar which can be used to [Corrupted|Corrupt] items",
        "Contains a Corruption Altar which can be used to modify [Corrupted] [Equipment] or Jewels unpredictably Room [IncursionDestabilization|Destabilises] once device is used"
      ],
      "mechanicSource": {
        "acceptedSources": [
          "ggpk_dat_exports",
          "schema_min_json",
          "official_patch_notes",
          "live_observations"
        ],
        "excludedSources": [
          "third_party_frontend_source"
        ],
        "ggpkUpgradeStatus": "ggpk_source_set_confirmed_semantics_local",
        "upgradeSources": {
          "ggpk": [
            "sacrificial_chamber",
            "thaumaturge"
          ],
          "local": [
            "sacrificial_chamber",
            "thaumaturge"
          ],
          "missingFromLocal": [],
          "extraInLocal": []
        },
        "upgradeSemantics": "source_set_ggpk_confirmed_semantics_local",
        "powerTier": "none"
      }
    },
    {
      "id": "vault",
      "name_zh": "藏宝库",
      "name_en": "Vault",
      "category": "reward",
      "tierChain": [
        "Sealed Vault"
      ],
      "maxTier": 1,
      "t4Unlockable": false,
      "needsPower": false,
      "powerCount": 0,
      "snakeRole": "filler",
      "oneShot": false,
      "fixedSlot": false,
      "destabiliseEligible": true,
      "valueClass": "high",
      "notes": "通用宝库基础。开启会触发瓦解(0.5 也适用 downgrade-to-path 规则)。tier 名待补。",
      "unpackedId": "Vault",
      "unpackedRoomIndex": 17,
      "unpackedName": "Treasure Vault",
      "unpackedFlags": {
        "isPathway": false,
        "isPresentDay": true,
        "isBossReward": false,
        "upgradedByPower": 0
      },
      "unpackedLevels": [
        {
          "level": 1,
          "id": "vault",
          "name": "Sealed Vault",
          "mod": 14919,
          "modValues": [
            25
          ],
          "description": "Contains a variety of valuable Chests based on surrounding Rooms\r\nRoom [IncursionDestabilization|Destabilises] once the central Vault is opened",
          "description2": ""
        }
      ],
      "dataSource": {
        "unpacked": "Content.ggpk:data/balance/incursion2*.datc64",
        "unpackedAt": "2026-06-01"
      },
      "clientDescription": [
        "Contains a variety of valuable Chests based on surrounding Rooms Room [IncursionDestabilization|Destabilises] once the central Vault is opened"
      ],
      "mechanicSource": {
        "acceptedSources": [
          "ggpk_dat_exports",
          "schema_min_json",
          "official_patch_notes",
          "live_observations"
        ],
        "excludedSources": [
          "third_party_frontend_source"
        ],
        "ggpkUpgradeStatus": "not_in_ggpk_upgrade_derivation",
        "upgradeSources": null,
        "upgradeSemantics": "no_tracked_ggpk_upgrade_rule",
        "powerTier": "none"
      }
    },
    {
      "id": "sacrificial_chamber",
      "name_zh": "献祭室",
      "name_en": "Sacrificial Chamber",
      "category": "craft",
      "tierChain": [
        "Altar of Sacrifice",
        "Hall of Offerings",
        "Apex of Oblation",
        "Empyrean of Blood"
      ],
      "maxTier": 4,
      "t4Unlockable": true,
      "needsPower": false,
      "powerCount": 0,
      "snakeRole": "filler",
      "oneShot": false,
      "fixedSlot": false,
      "destabiliseEligible": true,
      "valueClass": "mid",
      "medallionDrops": {
        "1": ["quipolatl", "uromoti"],
        "2": ["quipolatl", "uromoti"],
        "3": ["juatalotli", "hayoxi", "uromoti", "estazunti", "zantipi"],
        "4": ["juatalotli", "hayoxi", "uromoti", "estazunti", "zantipi"]
      },
      "medallionDropsSource": "GGPK Incursion2RoomPerLevel.Description2 一手解码 2026-06-03",
      "modBonus": [
        {
          "stat": "rare_chests",
          "byTier": [
            15,
            30,
            60,
            90
          ],
          "source": "unpacked:Incursion2RoomPerLevel.ModValues"
        }
      ],
      "t3Special": "high_priest_morphology",
      "notes": "献祭奖励。**poe2db**:T1/T2/T3 rare chests +15/30/60%;T3 添加 High Priest + Morphology Mechanism。当前 GGPK Incursion2Rooms 未列 UpgradedBy;按无邻接升级规则处理。",
      "unpackedId": "SacrificialChamber",
      "unpackedRoomIndex": 18,
      "unpackedName": "Sacrificial Chamber",
      "unpackedFlags": {
        "isPathway": false,
        "isPresentDay": false,
        "isBossReward": false,
        "upgradedByPower": 0
      },
      "unpackedLevels": [
        {
          "level": 1,
          "id": "sacrificechamber_lvl1",
          "name": "Altar of Sacrifice",
          "mod": 14921,
          "modValues": [
            15,
            0
          ],
          "description": "Contains a Unique Item",
          "description2": "May drop [IncursionMedallionIncreaseRoomTier|Quipolatl's Medallion] or [IncursionMedallionAddRoom|Uromoti's Medallion]"
        },
        {
          "level": 2,
          "id": "sacrificechamber_lvl2",
          "name": "Hall of Offerings",
          "mod": 14921,
          "modValues": [
            30,
            0
          ],
          "description": "Contains a Unique Item",
          "description2": "May drop [IncursionMedallionIncreaseRoomTier|Quipolatl's Medallion] or [IncursionMedallionAddRoom|Uromoti's Medallion]"
        },
        {
          "level": 3,
          "id": "sacrificechamber_lvl3",
          "name": "Apex of Oblation",
          "mod": 14921,
          "modValues": [
            60,
            1
          ],
          "description": "Contains a Unique Item\r\nContains the Morphology Mechanism which can be used to modify [Corrupted] Unique Items\r\nRoom [IncursionDestabilization|Destabilises] once device is used",
          "description2": "May drop [IncursionMedallionPreventDestabilise|Juatalotli's Medallion], [IncursionMedallionRerollRestrictedRoom|Hayoxi's Medallion], [IncursionMedallionAddRoom|Uromoti's Medallion], [IncursionMedallionAddAdditionalRestrictedRoom|Estazunti's Medallion] or [IncursionMedallionAddTempleModifier|Zantipi's Medallion]"
        },
        {
          "level": 4,
          "id": "sacrificechamber_lvl4",
          "name": "Empyrean of Blood",
          "mod": 14921,
          "modValues": [
            90,
            1
          ],
          "description": "Contains a Unique Item\r\nContains the Morphology Mechanism which can be used to modify [Corrupted] Unique Items\r\nRoom [IncursionDestabilization|Destabilises] once device is used",
          "description2": "May drop [IncursionMedallionPreventDestabilise|Juatalotli's Medallion], [IncursionMedallionRerollRestrictedRoom|Hayoxi's Medallion], [IncursionMedallionAddRoom|Uromoti's Medallion], [IncursionMedallionAddAdditionalRestrictedRoom|Estazunti's Medallion] or [IncursionMedallionAddTempleModifier|Zantipi's Medallion]"
        }
      ],
      "dataSource": {
        "unpacked": "Content.ggpk:data/balance/incursion2*.datc64",
        "unpackedAt": "2026-06-01"
      },
      "clientDescription": [
        "Contains a Unique Item",
        "Contains a Unique Item Contains the Morphology Mechanism which can be used to modify [Corrupted] Unique Items Room [IncursionDestabilization|Destabilises] once device is used"
      ],
      "clientDropText": [
        "May drop [IncursionMedallionIncreaseRoomTier|Quipolatl's Medallion] or [IncursionMedallionAddRoom|Uromoti's Medallion]",
        "May drop [IncursionMedallionPreventDestabilise|Juatalotli's Medallion], [IncursionMedallionRerollRestrictedRoom|Hayoxi's Medallion], [IncursionMedallionAddRoom|Uromoti's Medallion], [IncursionMedallionAddAdditionalRestrictedRoom|Estazunti's Medallion] or [IncursionMedallionAddTempleModifier|Zantipi's Medallion]"
      ],
      "mechanicSource": {
        "acceptedSources": [
          "ggpk_dat_exports",
          "schema_min_json",
          "official_patch_notes",
          "live_observations"
        ],
        "excludedSources": [
          "third_party_frontend_source"
        ],
        "ggpkUpgradeStatus": "no_ggpk_upgrade_sources",
        "upgradeSources": {
          "ggpk": [],
          "local": [],
          "missingFromLocal": [],
          "extraInLocal": []
        },
        "upgradeSemantics": "no_tracked_ggpk_upgrade_rule",
        "powerTier": "none"
      }
    },
    {
      "id": "royal_access_chamber",
      "name_zh": "皇家通道室",
      "name_en": "Royal Access Chamber",
      "category": "reward",
      "tierChain": [
        "Royal Access Chamber"
      ],
      "maxTier": 1,
      "t4Unlockable": false,
      "needsPower": false,
      "powerCount": 0,
      "snakeRole": "locked-end",
      "oneShot": true,
      "fixedSlot": false,
      "destabiliseEligible": false,
      "valueClass": "very-high",
      "notes": "**poe2wiki line 901-919**:Restricted Room,由 Xipocado's Console(击杀建筑师后)放置,且只能放在外缘候选格。**作用**:解锁阿兹里殿堂的门(无 Royal Access 就无法挑战阿兹里)。**每个神庙最多 1 个**(poe2wiki line 903)。**击杀阿兹里时被摧毁**(poe2wiki line 296),要再访阿兹里必须重新击杀建筑师 + 重新放置。**Area Level 75+ 解锁**(line 314)。Restricted Room 免疫常规塌陷,只有阿兹里击杀显式销毁。",
      "unpackedId": "AccessChamber",
      "unpackedRoomIndex": 27,
      "unpackedName": "Royal Access Chamber",
      "unpackedFlags": {
        "isPathway": false,
        "isPresentDay": false,
        "isBossReward": true,
        "upgradedByPower": 0
      },
      "unpackedLevels": [
        {
          "level": 1,
          "id": "access_chamber",
          "name": "Royal Access Chamber",
          "mod": null,
          "modValues": [],
          "description": "Completion unlocks access to Atziri's Chamber\r\nRoom [IncursionDestabilization|Destabilises] once accessible",
          "description2": ""
        }
      ],
      "dataSource": {
        "unpacked": "Content.ggpk:data/balance/incursion2*.datc64",
        "unpackedAt": "2026-06-01"
      },
      "clientDescription": [
        "Completion unlocks access to Atziri's Chamber Room [IncursionDestabilization|Destabilises] once accessible"
      ],
      "mechanicSource": {
        "acceptedSources": [
          "ggpk_dat_exports",
          "schema_min_json",
          "official_patch_notes",
          "live_observations"
        ],
        "excludedSources": [
          "third_party_frontend_source"
        ],
        "ggpkUpgradeStatus": "no_ggpk_upgrade_sources",
        "upgradeSources": {
          "ggpk": [],
          "local": [],
          "missingFromLocal": [],
          "extraInLocal": []
        },
        "upgradeSemantics": "no_tracked_ggpk_upgrade_rule",
        "powerTier": "none"
      }
    },
    {
      "id": "ancient_reliquary_vault",
      "name_zh": "古代圣物宝库",
      "name_en": "Ancient Reliquary Vault",
      "category": "reward",
      "tierChain": [
        "Ancient Reliquary Vault"
      ],
      "maxTier": 1,
      "t4Unlockable": false,
      "needsPower": false,
      "powerCount": 0,
      "snakeRole": "locked-end",
      "oneShot": true,
      "fixedSlot": false,
      "destabiliseEligible": true,
      "valueClass": "very-high",
      "notes": "一次性宝库。",
      "unpackedId": "UniqueReward",
      "unpackedRoomIndex": 26,
      "unpackedName": "Uniques Vault",
      "unpackedFlags": {
        "isPathway": false,
        "isPresentDay": false,
        "isBossReward": true,
        "upgradedByPower": 0
      },
      "unpackedLevels": [
        {
          "level": 1,
          "id": "unique_reward",
          "name": "Ancient Reliquary Vault",
          "mod": null,
          "modValues": [],
          "description": "Contains a Reliquary Display which holds a Unique item\r\nRoom [IncursionDestabilization|Destabilises] once accessible",
          "description2": ""
        }
      ],
      "dataSource": {
        "unpacked": "Content.ggpk:data/balance/incursion2*.datc64",
        "unpackedAt": "2026-06-01"
      },
      "clientDescription": [
        "Contains a Reliquary Display which holds a Unique item Room [IncursionDestabilization|Destabilises] once accessible"
      ],
      "mechanicSource": {
        "acceptedSources": [
          "ggpk_dat_exports",
          "schema_min_json",
          "official_patch_notes",
          "live_observations"
        ],
        "excludedSources": [
          "third_party_frontend_source"
        ],
        "ggpkUpgradeStatus": "not_in_ggpk_upgrade_derivation",
        "upgradeSources": null,
        "upgradeSemantics": "no_tracked_ggpk_upgrade_rule",
        "powerTier": "none"
      }
    },
    {
      "id": "kishara_vault",
      "name_zh": "Kishara 宝库",
      "name_en": "Kishara's Vault",
      "category": "reward",
      "tierChain": [
        "Kishara's Vault"
      ],
      "maxTier": 1,
      "t4Unlockable": false,
      "needsPower": false,
      "powerCount": 0,
      "snakeRole": "locked-end",
      "oneShot": true,
      "fixedSlot": false,
      "destabiliseEligible": true,
      "valueClass": "very-high",
      "notes": "通货堆。一次性。",
      "unpackedId": "CurrencyReward",
      "unpackedRoomIndex": 22,
      "unpackedName": "Currency Vault",
      "unpackedFlags": {
        "isPathway": false,
        "isPresentDay": true,
        "isBossReward": true,
        "upgradedByPower": 0
      },
      "unpackedLevels": [
        {
          "level": 1,
          "id": "currency_reward",
          "name": "Kishara's Vault",
          "mod": null,
          "modValues": [],
          "description": "Contains Rare Treasury Chests containing Currency\r\nRoom [IncursionDestabilization|Destabilises] once accessible",
          "description2": ""
        }
      ],
      "dataSource": {
        "unpacked": "Content.ggpk:data/balance/incursion2*.datc64",
        "unpackedAt": "2026-06-01"
      },
      "clientDescription": [
        "Contains Rare Treasury Chests containing Currency Room [IncursionDestabilization|Destabilises] once accessible"
      ],
      "mechanicSource": {
        "acceptedSources": [
          "ggpk_dat_exports",
          "schema_min_json",
          "official_patch_notes",
          "live_observations"
        ],
        "excludedSources": [
          "third_party_frontend_source"
        ],
        "ggpkUpgradeStatus": "not_in_ggpk_upgrade_derivation",
        "upgradeSources": null,
        "upgradeSemantics": "no_tracked_ggpk_upgrade_rule",
        "powerTier": "none"
      }
    },
    {
      "id": "jiquani_vault",
      "name_zh": "Jiquani 宝库",
      "name_en": "Jiquani's Vault",
      "category": "reward",
      "tierChain": [
        "Jiquani's Vault"
      ],
      "maxTier": 1,
      "t4Unlockable": false,
      "needsPower": false,
      "powerCount": 0,
      "snakeRole": "locked-end",
      "oneShot": true,
      "fixedSlot": false,
      "destabiliseEligible": true,
      "valueClass": "very-high",
      "notes": "高级符文。一次性。",
      "unpackedId": "SocketableReward",
      "unpackedRoomIndex": 24,
      "unpackedName": "Augments Vault",
      "unpackedFlags": {
        "isPathway": false,
        "isPresentDay": true,
        "isBossReward": true,
        "upgradedByPower": 0
      },
      "unpackedLevels": [
        {
          "level": 1,
          "id": "socketable_reward",
          "name": "Jiquani's Vault",
          "mod": null,
          "modValues": [],
          "description": "Contains a Rune Cache containing [Rune|Runes]\r\nRoom [IncursionDestabilization|Destabilises] once accessible",
          "description2": ""
        }
      ],
      "dataSource": {
        "unpacked": "Content.ggpk:data/balance/incursion2*.datc64",
        "unpackedAt": "2026-06-01"
      },
      "clientDescription": [
        "Contains a Rune Cache containing [Rune|Runes] Room [IncursionDestabilization|Destabilises] once accessible"
      ],
      "mechanicSource": {
        "acceptedSources": [
          "ggpk_dat_exports",
          "schema_min_json",
          "official_patch_notes",
          "live_observations"
        ],
        "excludedSources": [
          "third_party_frontend_source"
        ],
        "ggpkUpgradeStatus": "not_in_ggpk_upgrade_derivation",
        "upgradeSources": null,
        "upgradeSemantics": "no_tracked_ggpk_upgrade_rule",
        "powerTier": "none"
      }
    },
    {
      "id": "currency_vault",
      "name_zh": "通货宝库",
      "name_en": "Currency Vault",
      "category": "reward",
      "tierChain": [
        "Currency Vault"
      ],
      "maxTier": 3,
      "t4Unlockable": false,
      "needsPower": false,
      "powerCount": 0,
      "snakeRole": "locked-end",
      "oneShot": true,
      "fixedSlot": false,
      "destabiliseEligible": true,
      "valueClass": "high",
      "notes": "一次性。通货掉落。**per-tier 数据未解包**(2026-06):Incursion2RoomPerLevel 只有 Level 1 行(CurrencyReward Room idx 22),GGPK 不含 T2/T3 的 ModValues/收益分级。maxTier=3 为本地推断,各 tier 收益靠 scoring 占位公式 `1 + tier*0.4`(scoring.py VAULT tier scaling,PLACEHOLDER-05),待实测/后续解包补 tierChain + per-tier。",
      "unpackedId": "CurrencyReward",
      "unpackedRoomIndex": 22,
      "unpackedName": "Currency Vault",
      "unpackedFlags": {
        "isPathway": false,
        "isPresentDay": true,
        "isBossReward": true,
        "upgradedByPower": 0
      },
      "unpackedLevels": [
        {
          "level": 1,
          "id": "currency_reward",
          "name": "Kishara's Vault",
          "mod": null,
          "modValues": [],
          "description": "Contains Rare Treasury Chests containing Currency\r\nRoom [IncursionDestabilization|Destabilises] once accessible",
          "description2": ""
        }
      ],
      "dataSource": {
        "unpacked": "Content.ggpk:data/balance/incursion2*.datc64",
        "unpackedAt": "2026-06-01"
      },
      "clientDescription": [
        "Contains Rare Treasury Chests containing Currency Room [IncursionDestabilization|Destabilises] once accessible"
      ],
      "mechanicSource": {
        "acceptedSources": [
          "ggpk_dat_exports",
          "schema_min_json",
          "official_patch_notes",
          "live_observations"
        ],
        "excludedSources": [
          "third_party_frontend_source"
        ],
        "ggpkUpgradeStatus": "no_ggpk_upgrade_sources",
        "upgradeSources": {
          "ggpk": [],
          "local": [],
          "missingFromLocal": [],
          "extraInLocal": []
        },
        "upgradeSemantics": "no_tracked_ggpk_upgrade_rule",
        "powerTier": "none"
      }
    },
    {
      "id": "gem_vault",
      "name_zh": "传承宝石宝库",
      "name_en": "Gem Vault",
      "category": "reward",
      "tierChain": [
        "Vault of Reverence"
      ],
      "maxTier": 1,
      "t4Unlockable": false,
      "needsPower": false,
      "powerCount": 0,
      "snakeRole": "locked-end",
      "oneShot": true,
      "fixedSlot": false,
      "destabiliseEligible": true,
      "valueClass": "high",
      "notes": "一次性。传承宝石。",
      "unpackedId": "LineageSupportReward",
      "unpackedRoomIndex": 23,
      "unpackedName": "Lineage Gems Vault",
      "unpackedFlags": {
        "isPathway": false,
        "isPresentDay": false,
        "isBossReward": true,
        "upgradedByPower": 0
      },
      "unpackedLevels": [
        {
          "level": 1,
          "id": "lineage_support_reward",
          "name": "Vault of Reverence",
          "mod": null,
          "modValues": [],
          "description": "Contains a Historic Chest containing a random [LineageSupports|Lineage Support Gem]\r\nRoom [IncursionDestabilization|Destabilises] once accessible",
          "description2": ""
        }
      ],
      "dataSource": {
        "unpacked": "Content.ggpk:data/balance/incursion2*.datc64",
        "unpackedAt": "2026-06-01"
      },
      "clientDescription": [
        "Contains a Historic Chest containing a random [LineageSupports|Lineage Support Gem] Room [IncursionDestabilization|Destabilises] once accessible"
      ],
      "mechanicSource": {
        "acceptedSources": [
          "ggpk_dat_exports",
          "schema_min_json",
          "official_patch_notes",
          "live_observations"
        ],
        "excludedSources": [
          "third_party_frontend_source"
        ],
        "ggpkUpgradeStatus": "no_ggpk_upgrade_sources",
        "upgradeSources": {
          "ggpk": [],
          "local": [],
          "missingFromLocal": [],
          "extraInLocal": []
        },
        "upgradeSemantics": "no_tracked_ggpk_upgrade_rule",
        "powerTier": "none"
      }
    },
    {
      "id": "augment_vault",
      "name_zh": "增幅器宝库",
      "name_en": "Augment Vault",
      "category": "reward",
      "tierChain": [
        "Augment Vault"
      ],
      "maxTier": 3,
      "t4Unlockable": false,
      "needsPower": false,
      "powerCount": 0,
      "snakeRole": "locked-end",
      "oneShot": true,
      "fixedSlot": false,
      "destabiliseEligible": true,
      "valueClass": "high",
      "notes": "一次性。增幅器掉落。**per-tier 数据未解包**(2026-06):Incursion2RoomPerLevel 只有 Level 1 行(SocketableReward Room idx 24),GGPK 不含 T2/T3 的 ModValues/收益分级。maxTier=3 为本地推断,各 tier 收益靠 scoring 占位公式 `1 + tier*0.4`(scoring.py VAULT tier scaling,PLACEHOLDER-05),待实测/后续解包补 tierChain + per-tier。",
      "unpackedId": "SocketableReward",
      "unpackedRoomIndex": 24,
      "unpackedName": "Augments Vault",
      "unpackedFlags": {
        "isPathway": false,
        "isPresentDay": true,
        "isBossReward": true,
        "upgradedByPower": 0
      },
      "unpackedLevels": [
        {
          "level": 1,
          "id": "socketable_reward",
          "name": "Jiquani's Vault",
          "mod": null,
          "modValues": [],
          "description": "Contains a Rune Cache containing [Rune|Runes]\r\nRoom [IncursionDestabilization|Destabilises] once accessible",
          "description2": ""
        }
      ],
      "dataSource": {
        "unpacked": "Content.ggpk:data/balance/incursion2*.datc64",
        "unpackedAt": "2026-06-01"
      },
      "clientDescription": [
        "Contains a Rune Cache containing [Rune|Runes] Room [IncursionDestabilization|Destabilises] once accessible"
      ],
      "mechanicSource": {
        "acceptedSources": [
          "ggpk_dat_exports",
          "schema_min_json",
          "official_patch_notes",
          "live_observations"
        ],
        "excludedSources": [
          "third_party_frontend_source"
        ],
        "ggpkUpgradeStatus": "no_ggpk_upgrade_sources",
        "upgradeSources": {
          "ggpk": [],
          "local": [],
          "missingFromLocal": [],
          "extraInLocal": []
        },
        "upgradeSemantics": "no_tracked_ggpk_upgrade_rule",
        "powerTier": "none"
      }
    },
    {
      "id": "tablet_vault",
      "name_zh": "石板宝库",
      "name_en": "Tablet Vault",
      "category": "reward",
      "tierChain": [
        "Tablet Research Vault"
      ],
      "maxTier": 1,
      "t4Unlockable": false,
      "needsPower": false,
      "powerCount": 0,
      "snakeRole": "locked-end",
      "oneShot": true,
      "fixedSlot": false,
      "destabiliseEligible": true,
      "valueClass": "high",
      "notes": "一次性。地图石板。",
      "unpackedId": "TabletReward",
      "unpackedRoomIndex": 25,
      "unpackedName": "Tablets Vault",
      "unpackedFlags": {
        "isPathway": false,
        "isPresentDay": false,
        "isBossReward": true,
        "upgradedByPower": 0
      },
      "unpackedLevels": [
        {
          "level": 1,
          "id": "tablet_reward",
          "name": "Tablet Research Vault",
          "mod": null,
          "modValues": [],
          "description": "Contains the Corrupted Precursor Machine which allows the [Corrupted|Corruption] of a [Tablet|Tablet]\r\nRoom [IncursionDestabilization|Destabilises] once accessible",
          "description2": ""
        }
      ],
      "dataSource": {
        "unpacked": "Content.ggpk:data/balance/incursion2*.datc64",
        "unpackedAt": "2026-06-01"
      },
      "clientDescription": [
        "Contains the Corrupted Precursor Machine which allows the [Corrupted|Corruption] of a [Tablet|Tablet] Room [IncursionDestabilization|Destabilises] once accessible"
      ],
      "mechanicSource": {
        "acceptedSources": [
          "ggpk_dat_exports",
          "schema_min_json",
          "official_patch_notes",
          "live_observations"
        ],
        "excludedSources": [
          "third_party_frontend_source"
        ],
        "ggpkUpgradeStatus": "no_ggpk_upgrade_sources",
        "upgradeSources": {
          "ggpk": [],
          "local": [],
          "missingFromLocal": [],
          "extraInLocal": []
        },
        "upgradeSemantics": "no_tracked_ggpk_upgrade_rule",
        "powerTier": "none"
      }
    },
    {
      "id": "unique_vault",
      "name_zh": "传奇宝库",
      "name_en": "Unique Vault",
      "category": "reward",
      "tierChain": [
        "Unique Vault"
      ],
      "maxTier": 3,
      "t4Unlockable": false,
      "needsPower": false,
      "powerCount": 0,
      "snakeRole": "locked-end",
      "oneShot": true,
      "fixedSlot": false,
      "destabiliseEligible": true,
      "valueClass": "very-high",
      "notes": "一次性。传奇装备掉落。**per-tier 数据未解包**(2026-06):Incursion2RoomPerLevel 只有 Level 1 行(UniqueReward Room idx 26),GGPK 不含 T2/T3 的 ModValues/收益分级。maxTier=3 为本地推断,各 tier 收益靠 scoring 占位公式 `1 + tier*0.4`(scoring.py VAULT tier scaling,PLACEHOLDER-05),待实测/后续解包补 tierChain + per-tier。",
      "unpackedId": "UniqueReward",
      "unpackedRoomIndex": 26,
      "unpackedName": "Uniques Vault",
      "unpackedFlags": {
        "isPathway": false,
        "isPresentDay": false,
        "isBossReward": true,
        "upgradedByPower": 0
      },
      "unpackedLevels": [
        {
          "level": 1,
          "id": "unique_reward",
          "name": "Ancient Reliquary Vault",
          "mod": null,
          "modValues": [],
          "description": "Contains a Reliquary Display which holds a Unique item\r\nRoom [IncursionDestabilization|Destabilises] once accessible",
          "description2": ""
        }
      ],
      "dataSource": {
        "unpacked": "Content.ggpk:data/balance/incursion2*.datc64",
        "unpackedAt": "2026-06-01"
      },
      "clientDescription": [
        "Contains a Reliquary Display which holds a Unique item Room [IncursionDestabilization|Destabilises] once accessible"
      ],
      "mechanicSource": {
        "acceptedSources": [
          "ggpk_dat_exports",
          "schema_min_json",
          "official_patch_notes",
          "live_observations"
        ],
        "excludedSources": [
          "third_party_frontend_source"
        ],
        "ggpkUpgradeStatus": "no_ggpk_upgrade_sources",
        "upgradeSources": {
          "ggpk": [],
          "local": [],
          "missingFromLocal": [],
          "extraInLocal": []
        },
        "upgradeSemantics": "no_tracked_ggpk_upgrade_rule",
        "powerTier": "none"
      }
    },
    {
      "id": "sealed_vault",
      "name_zh": "密封宝库",
      "name_en": "Sealed Vault",
      "category": "reward",
      "tierChain": [
        "Sealed Vault"
      ],
      "maxTier": 3,
      "t4Unlockable": false,
      "needsPower": false,
      "powerCount": 0,
      "snakeRole": "locked-end",
      "oneShot": true,
      "fixedSlot": false,
      "destabiliseEligible": true,
      "valueClass": "very-high",
      "notes": "一次性。开启会大量瓦解,适用 0.5 downgrade-to-path 规则。**per-tier 数据未解包**(2026-06):Incursion2RoomPerLevel 只有 Level 1 行(Vault Room idx 17,ModValues[25]),GGPK 不含 T2/T3 的 ModValues/收益分级。maxTier=3 为本地推断,各 tier 收益靠 scoring 占位公式 `1 + tier*0.4`(scoring.py VAULT tier scaling,PLACEHOLDER-05),待实测/后续解包补 tierChain + per-tier。",
      "unpackedId": "Vault",
      "unpackedRoomIndex": 17,
      "unpackedName": "Treasure Vault",
      "unpackedFlags": {
        "isPathway": false,
        "isPresentDay": true,
        "isBossReward": false,
        "upgradedByPower": 0
      },
      "unpackedLevels": [
        {
          "level": 1,
          "id": "vault",
          "name": "Sealed Vault",
          "mod": 14919,
          "modValues": [
            25
          ],
          "description": "Contains a variety of valuable Chests based on surrounding Rooms\r\nRoom [IncursionDestabilization|Destabilises] once the central Vault is opened",
          "description2": ""
        }
      ],
      "dataSource": {
        "unpacked": "Content.ggpk:data/balance/incursion2*.datc64",
        "unpackedAt": "2026-06-01"
      },
      "clientDescription": [
        "Contains a variety of valuable Chests based on surrounding Rooms Room [IncursionDestabilization|Destabilises] once the central Vault is opened"
      ],
      "mechanicSource": {
        "acceptedSources": [
          "ggpk_dat_exports",
          "schema_min_json",
          "official_patch_notes",
          "live_observations"
        ],
        "excludedSources": [
          "third_party_frontend_source"
        ],
        "ggpkUpgradeStatus": "no_ggpk_upgrade_sources",
        "upgradeSources": {
          "ggpk": [],
          "local": [],
          "missingFromLocal": [],
          "extraInLocal": []
        },
        "upgradeSemantics": "no_tracked_ggpk_upgrade_rule",
        "powerTier": "none"
      }
    },
    {
      "id": "extraction_chamber",
      "name_zh": "萃取厅",
      "name_en": "Extraction Chamber",
      "category": "craft",
      "tierChain": [
        "Extraction Chamber"
      ],
      "maxTier": 1,
      "t4Unlockable": false,
      "needsPower": false,
      "powerCount": 0,
      "snakeRole": "none",
      "oneShot": true,
      "fixedSlot": false,
      "destabiliseEligible": true,
      "valueClass": "high",
      "notes": "一次性。瓦尔注能装置相关(0.5 改为 4 种独立物品)。",
      "unpackedId": "UnsocketingReward",
      "unpackedRoomIndex": 29,
      "unpackedName": "Extraction Chamber",
      "unpackedFlags": {
        "isPathway": false,
        "isPresentDay": false,
        "isBossReward": true,
        "upgradedByPower": 0
      },
      "unpackedLevels": [
        {
          "level": 1,
          "id": "unsocketing_reward",
          "name": "Extraction Chamber",
          "mod": null,
          "modValues": [],
          "description": "Contains the Extraction Workbench which can be used to destroy an [Equipment] item, returning any [Augment|Augments] socketed in it\r\nRoom [IncursionDestabilization|Destabilises] once accessible",
          "description2": ""
        }
      ],
      "dataSource": {
        "unpacked": "Content.ggpk:data/balance/incursion2*.datc64",
        "unpackedAt": "2026-06-01"
      },
      "clientDescription": [
        "Contains the Extraction Workbench which can be used to destroy an [Equipment] item, returning any [Augment|Augments] socketed in it Room [IncursionDestabilization|Destabilises] once accessible"
      ],
      "mechanicSource": {
        "acceptedSources": [
          "ggpk_dat_exports",
          "schema_min_json",
          "official_patch_notes",
          "live_observations"
        ],
        "excludedSources": [
          "third_party_frontend_source"
        ],
        "ggpkUpgradeStatus": "no_ggpk_upgrade_sources",
        "upgradeSources": {
          "ggpk": [],
          "local": [],
          "missingFromLocal": [],
          "extraInLocal": []
        },
        "upgradeSemantics": "no_tracked_ggpk_upgrade_rule",
        "powerTier": "none"
      }
    },
    {
      "id": "biome_water",
      "name_zh": "地形研究:水",
      "name_en": "Terraforming Research: Water",
      "category": "biome",
      "tierChain": [
        "Terraforming Research: Water"
      ],
      "maxTier": 1,
      "t4Unlockable": false,
      "needsPower": false,
      "powerCount": 0,
      "snakeRole": "none",
      "oneShot": true,
      "fixedSlot": false,
      "destabiliseEligible": true,
      "valueClass": "very-low",
      "biomeTag": "water",
      "notes": "biome 房(0.5 解包,Incursion2Rooms _index 31)。**机制**:可达即塌(one-shot,Description \"Room Destabilises once accessible\")。**价值=biome 标签,非 loot**:GGPK Mod 16669=AreaCountsAsWaterBiome(纯地形/纹章标签,ModValues[1]=开关),不产出任何 loot stat,故无 modBonus、valueClass=very-low(scoring 贡献 0)。具体玩法/收益(地形/纹章联动)未建模,待实测。**未接入 sweep/MC**:oneShot 房不进手牌池(is_hand_drawable 排除),不参与 Monte Carlo / strategy search。",
      "unpackedId": "BiomeWater",
      "unpackedRoomIndex": 31,
      "unpackedName": "Terraforming Research",
      "unpackedFlags": {
        "isPathway": false,
        "isPresentDay": false,
        "isBossReward": true,
        "upgradedByPower": 0
      },
      "unpackedLevels": [
        {
          "level": 1,
          "id": "biome_water",
          "name": "Terraforming Research: Water",
          "mod": 16669,
          "modValues": [
            1
          ],
          "description": "Room [IncursionDestabilization|Destabilises] once accessible",
          "description2": ""
        }
      ],
      "dataSource": {
        "unpacked": "Content.ggpk:data/balance/incursion2*.datc64",
        "unpackedAt": "2026-06-01"
      },
      "clientDescription": [
        "Room [IncursionDestabilization|Destabilises] once accessible"
      ],
      "mechanicSource": {
        "acceptedSources": [
          "ggpk_dat_exports",
          "schema_min_json",
          "official_patch_notes",
          "live_observations"
        ],
        "excludedSources": [
          "third_party_frontend_source"
        ],
        "ggpkUpgradeStatus": "no_ggpk_upgrade_sources",
        "upgradeSources": {
          "ggpk": [],
          "local": [],
          "missingFromLocal": [],
          "extraInLocal": []
        },
        "upgradeSemantics": "no_tracked_ggpk_upgrade_rule",
        "powerTier": "none"
      }
    },
    {
      "id": "biome_mountain",
      "name_zh": "地形研究:山",
      "name_en": "Terraforming Research: Mountain",
      "category": "biome",
      "tierChain": [
        "Terraforming Research: Mountain"
      ],
      "maxTier": 1,
      "t4Unlockable": false,
      "needsPower": false,
      "powerCount": 0,
      "snakeRole": "none",
      "oneShot": true,
      "fixedSlot": false,
      "destabiliseEligible": true,
      "valueClass": "very-low",
      "biomeTag": "mountain",
      "notes": "biome 房(0.5 解包,Incursion2Rooms _index 32)。**机制**:可达即塌(one-shot,Description \"Room Destabilises once accessible\")。**价值=biome 标签,非 loot**:GGPK Mod 16670=AreaCountsAsMountainBiome(纯地形/纹章标签,ModValues[1]=开关),不产出任何 loot stat,故无 modBonus、valueClass=very-low(scoring 贡献 0)。具体玩法/收益(地形/纹章联动)未建模,待实测。**未接入 sweep/MC**:oneShot 房不进手牌池,不参与 Monte Carlo / strategy search。",
      "unpackedId": "BiomeMountain",
      "unpackedRoomIndex": 32,
      "unpackedName": "Terraforming Research",
      "unpackedFlags": {
        "isPathway": false,
        "isPresentDay": false,
        "isBossReward": true,
        "upgradedByPower": 0
      },
      "unpackedLevels": [
        {
          "level": 1,
          "id": "biome_mountain",
          "name": "Terraforming Research: Mountain",
          "mod": 16670,
          "modValues": [
            1
          ],
          "description": "Room [IncursionDestabilization|Destabilises] once accessible",
          "description2": ""
        }
      ],
      "dataSource": {
        "unpacked": "Content.ggpk:data/balance/incursion2*.datc64",
        "unpackedAt": "2026-06-01"
      },
      "clientDescription": [
        "Room [IncursionDestabilization|Destabilises] once accessible"
      ],
      "mechanicSource": {
        "acceptedSources": [
          "ggpk_dat_exports",
          "schema_min_json",
          "official_patch_notes",
          "live_observations"
        ],
        "excludedSources": [
          "third_party_frontend_source"
        ],
        "ggpkUpgradeStatus": "no_ggpk_upgrade_sources",
        "upgradeSources": {
          "ggpk": [],
          "local": [],
          "missingFromLocal": [],
          "extraInLocal": []
        },
        "upgradeSemantics": "no_tracked_ggpk_upgrade_rule",
        "powerTier": "none"
      }
    },
    {
      "id": "biome_grass",
      "name_zh": "地形研究:草原",
      "name_en": "Terraforming Research: Grass",
      "category": "biome",
      "tierChain": [
        "Terraforming Research: Grass"
      ],
      "maxTier": 1,
      "t4Unlockable": false,
      "needsPower": false,
      "powerCount": 0,
      "snakeRole": "none",
      "oneShot": true,
      "fixedSlot": false,
      "destabiliseEligible": true,
      "valueClass": "very-low",
      "biomeTag": "grass",
      "notes": "biome 房(0.5 解包,Incursion2Rooms _index 33)。**机制**:可达即塌(one-shot,Description \"Room Destabilises once accessible\")。**价值=biome 标签,非 loot**:GGPK Mod 16671=AreaCountsAsGrassBiome(纯地形/纹章标签,ModValues[1]=开关),不产出任何 loot stat,故无 modBonus、valueClass=very-low(scoring 贡献 0)。具体玩法/收益(地形/纹章联动)未建模,待实测。**未接入 sweep/MC**:oneShot 房不进手牌池,不参与 Monte Carlo / strategy search。",
      "unpackedId": "BiomeGrass",
      "unpackedRoomIndex": 33,
      "unpackedName": "Terraforming Research",
      "unpackedFlags": {
        "isPathway": false,
        "isPresentDay": false,
        "isBossReward": true,
        "upgradedByPower": 0
      },
      "unpackedLevels": [
        {
          "level": 1,
          "id": "biome_grass",
          "name": "Terraforming Research: Grass",
          "mod": 16671,
          "modValues": [
            1
          ],
          "description": "Room [IncursionDestabilization|Destabilises] once accessible",
          "description2": ""
        }
      ],
      "dataSource": {
        "unpacked": "Content.ggpk:data/balance/incursion2*.datc64",
        "unpackedAt": "2026-06-01"
      },
      "clientDescription": [
        "Room [IncursionDestabilization|Destabilises] once accessible"
      ],
      "mechanicSource": {
        "acceptedSources": [
          "ggpk_dat_exports",
          "schema_min_json",
          "official_patch_notes",
          "live_observations"
        ],
        "excludedSources": [
          "third_party_frontend_source"
        ],
        "ggpkUpgradeStatus": "no_ggpk_upgrade_sources",
        "upgradeSources": {
          "ggpk": [],
          "local": [],
          "missingFromLocal": [],
          "extraInLocal": []
        },
        "upgradeSemantics": "no_tracked_ggpk_upgrade_rule",
        "powerTier": "none"
      }
    },
    {
      "id": "biome_forest",
      "name_zh": "地形研究:森林",
      "name_en": "Terraforming Research: Forest",
      "category": "biome",
      "tierChain": [
        "Terraforming Research: Forest"
      ],
      "maxTier": 1,
      "t4Unlockable": false,
      "needsPower": false,
      "powerCount": 0,
      "snakeRole": "none",
      "oneShot": true,
      "fixedSlot": false,
      "destabiliseEligible": true,
      "valueClass": "very-low",
      "biomeTag": "forest",
      "notes": "biome 房(0.5 解包,Incursion2Rooms _index 34)。**机制**:可达即塌(one-shot,Description \"Room Destabilises once accessible\")。**价值=biome 标签,非 loot**:GGPK Mod 16672=AreaCountsAsForestBiome(纯地形/纹章标签,ModValues[1]=开关),不产出任何 loot stat,故无 modBonus、valueClass=very-low(scoring 贡献 0)。具体玩法/收益(地形/纹章联动)未建模,待实测。**未接入 sweep/MC**:oneShot 房不进手牌池,不参与 Monte Carlo / strategy search。",
      "unpackedId": "BiomeForest",
      "unpackedRoomIndex": 34,
      "unpackedName": "Terraforming Research",
      "unpackedFlags": {
        "isPathway": false,
        "isPresentDay": false,
        "isBossReward": true,
        "upgradedByPower": 0
      },
      "unpackedLevels": [
        {
          "level": 1,
          "id": "biome_forest",
          "name": "Terraforming Research: Forest",
          "mod": 16672,
          "modValues": [
            1
          ],
          "description": "Room [IncursionDestabilization|Destabilises] once accessible",
          "description2": ""
        }
      ],
      "dataSource": {
        "unpacked": "Content.ggpk:data/balance/incursion2*.datc64",
        "unpackedAt": "2026-06-01"
      },
      "clientDescription": [
        "Room [IncursionDestabilization|Destabilises] once accessible"
      ],
      "mechanicSource": {
        "acceptedSources": [
          "ggpk_dat_exports",
          "schema_min_json",
          "official_patch_notes",
          "live_observations"
        ],
        "excludedSources": [
          "third_party_frontend_source"
        ],
        "ggpkUpgradeStatus": "no_ggpk_upgrade_sources",
        "upgradeSources": {
          "ggpk": [],
          "local": [],
          "missingFromLocal": [],
          "extraInLocal": []
        },
        "upgradeSemantics": "no_tracked_ggpk_upgrade_rule",
        "powerTier": "none"
      }
    },
    {
      "id": "biome_swamp",
      "name_zh": "地形研究:沼泽",
      "name_en": "Terraforming Research: Swamp",
      "category": "biome",
      "tierChain": [
        "Terraforming Research: Swamp"
      ],
      "maxTier": 1,
      "t4Unlockable": false,
      "needsPower": false,
      "powerCount": 0,
      "snakeRole": "none",
      "oneShot": true,
      "fixedSlot": false,
      "destabiliseEligible": true,
      "valueClass": "very-low",
      "biomeTag": "swamp",
      "notes": "biome 房(0.5 解包,Incursion2Rooms _index 35)。**机制**:可达即塌(one-shot,Description \"Room Destabilises once accessible\")。**价值=biome 标签,非 loot**:GGPK Mod 16673=AreaCountsAsSwampBiome(纯地形/纹章标签,ModValues[1]=开关),不产出任何 loot stat,故无 modBonus、valueClass=very-low(scoring 贡献 0)。具体玩法/收益(地形/纹章联动)未建模,待实测。**未接入 sweep/MC**:oneShot 房不进手牌池,不参与 Monte Carlo / strategy search。",
      "unpackedId": "BiomeSwamp",
      "unpackedRoomIndex": 35,
      "unpackedName": "Terraforming Research",
      "unpackedFlags": {
        "isPathway": false,
        "isPresentDay": false,
        "isBossReward": true,
        "upgradedByPower": 0
      },
      "unpackedLevels": [
        {
          "level": 1,
          "id": "biome_swamp",
          "name": "Terraforming Research: Swamp",
          "mod": 16673,
          "modValues": [
            1
          ],
          "description": "Room [IncursionDestabilization|Destabilises] once accessible",
          "description2": ""
        }
      ],
      "dataSource": {
        "unpacked": "Content.ggpk:data/balance/incursion2*.datc64",
        "unpackedAt": "2026-06-01"
      },
      "clientDescription": [
        "Room [IncursionDestabilization|Destabilises] once accessible"
      ],
      "mechanicSource": {
        "acceptedSources": [
          "ggpk_dat_exports",
          "schema_min_json",
          "official_patch_notes",
          "live_observations"
        ],
        "excludedSources": [
          "third_party_frontend_source"
        ],
        "ggpkUpgradeStatus": "no_ggpk_upgrade_sources",
        "upgradeSources": {
          "ggpk": [],
          "local": [],
          "missingFromLocal": [],
          "extraInLocal": []
        },
        "upgradeSemantics": "no_tracked_ggpk_upgrade_rule",
        "powerTier": "none"
      }
    },
    {
      "id": "biome_desert",
      "name_zh": "地形研究:沙漠",
      "name_en": "Terraforming Research: Desert",
      "category": "biome",
      "tierChain": [
        "Terraforming Research: Desert"
      ],
      "maxTier": 1,
      "t4Unlockable": false,
      "needsPower": false,
      "powerCount": 0,
      "snakeRole": "none",
      "oneShot": true,
      "fixedSlot": false,
      "destabiliseEligible": true,
      "valueClass": "very-low",
      "biomeTag": "desert",
      "notes": "biome 房(0.5 解包,Incursion2Rooms _index 36)。**机制**:可达即塌(one-shot,Description \"Room Destabilises once accessible\")。**价值=biome 标签,非 loot**:GGPK Mod 16674=AreaCountsAsDesertBiome(纯地形/纹章标签,ModValues[1]=开关),不产出任何 loot stat,故无 modBonus、valueClass=very-low(scoring 贡献 0)。具体玩法/收益(地形/纹章联动)未建模,待实测。**未接入 sweep/MC**:oneShot 房不进手牌池,不参与 Monte Carlo / strategy search。",
      "unpackedId": "BiomeDesert",
      "unpackedRoomIndex": 36,
      "unpackedName": "Terraforming Research",
      "unpackedFlags": {
        "isPathway": false,
        "isPresentDay": false,
        "isBossReward": true,
        "upgradedByPower": 0
      },
      "unpackedLevels": [
        {
          "level": 1,
          "id": "biome_desert",
          "name": "Terraforming Research: Desert",
          "mod": 16674,
          "modValues": [
            1
          ],
          "description": "Room [IncursionDestabilization|Destabilises] once accessible",
          "description2": ""
        }
      ],
      "dataSource": {
        "unpacked": "Content.ggpk:data/balance/incursion2*.datc64",
        "unpackedAt": "2026-06-01"
      },
      "clientDescription": [
        "Room [IncursionDestabilization|Destabilises] once accessible"
      ],
      "mechanicSource": {
        "acceptedSources": [
          "ggpk_dat_exports",
          "schema_min_json",
          "official_patch_notes",
          "live_observations"
        ],
        "excludedSources": [
          "third_party_frontend_source"
        ],
        "ggpkUpgradeStatus": "no_ggpk_upgrade_sources",
        "upgradeSources": {
          "ggpk": [],
          "local": [],
          "missingFromLocal": [],
          "extraInLocal": []
        },
        "upgradeSemantics": "no_tracked_ggpk_upgrade_rule",
        "powerTier": "none"
      }
    },
    {
      "id": "architect_chamber",
      "name_zh": "建筑师之室",
      "name_en": "Architect's Chamber",
      "category": "boss",
      "tierChain": [
        "Architect's Chamber"
      ],
      "maxTier": 0,
      "t4Unlockable": false,
      "needsPower": false,
      "powerCount": 0,
      "snakeRole": "none",
      "oneShot": true,
      "fixedSlot": true,
      "destabiliseEligible": false,
      "valueClass": "very-high",
      "notes": "Royal Architect (Xipocado) boss 房。击杀后会瓦解一批房间(0.5 数量再减半)。**纹章(GGPK Incursion2RoomPerLevel architect Description 一手)**:击杀建筑师**解锁纹章系统**(medallions 击杀前锁定)+ 一次性 may drop Uromoti/Puhuarte/Zantipi。属一次性 bootstrap(击杀那一下),**非 per-visit 产出**,故不入 medallionDrops/collectMedallions。模型当前未 gate「击杀前锁定」——实战架构师早杀,稳态下 moot,待实测确认是否需建。",
      "unpackedId": "Architect",
      "unpackedRoomIndex": 20,
      "unpackedName": "Architect's Chamber",
      "unpackedFlags": {
        "isPathway": false,
        "isPresentDay": true,
        "isBossReward": false,
        "upgradedByPower": 0
      },
      "unpackedLevels": [
        {
          "level": 1,
          "id": "architect",
          "name": "Architect's Chamber",
          "mod": null,
          "modValues": [],
          "description": "Defeating the Architect allows use of Xipocado's Console which can be used to place various [IncursionRestrictedRoom|Restricted Rooms]\r\nDefeating the Architect also unlocks [IncursionMedallions|Medallions]",
          "description2": "May drop [IncursionMedallionAddRoom|Uromoti's Medallion], [IncursionMedallionRerollRoomCards|Puhuarte's Medallion] or [IncursionMedallionAddTempleModifier|Zantipi's Medallion]"
        }
      ],
      "dataSource": {
        "unpacked": "Content.ggpk:data/balance/incursion2*.datc64",
        "unpackedAt": "2026-06-01"
      },
      "clientDescription": [
        "Defeating the Architect allows use of Xipocado's Console which can be used to place various [IncursionRestrictedRoom|Restricted Rooms] Defeating the Architect also unlocks [IncursionMedallions|Medallions]"
      ],
      "clientDropText": [
        "May drop [IncursionMedallionAddRoom|Uromoti's Medallion], [IncursionMedallionRerollRoomCards|Puhuarte's Medallion] or [IncursionMedallionAddTempleModifier|Zantipi's Medallion]"
      ],
      "mechanicSource": {
        "acceptedSources": [
          "ggpk_dat_exports",
          "schema_min_json",
          "official_patch_notes",
          "live_observations"
        ],
        "excludedSources": [
          "third_party_frontend_source"
        ],
        "ggpkUpgradeStatus": "no_ggpk_upgrade_sources",
        "upgradeSources": {
          "ggpk": [],
          "local": [],
          "missingFromLocal": [],
          "extraInLocal": []
        },
        "upgradeSemantics": "no_tracked_ggpk_upgrade_rule",
        "powerTier": "none"
      }
    },
    {
      "id": "atziri_chamber",
      "name_zh": "阿兹里的殿堂",
      "name_en": "Atziri's Chamber",
      "category": "boss",
      "tierChain": [
        "Atziri's Chamber"
      ],
      "maxTier": 0,
      "t4Unlockable": false,
      "needsPower": false,
      "powerCount": 0,
      "snakeRole": "none",
      "oneShot": true,
      "fixedSlot": true,
      "destabiliseEligible": false,
      "valueClass": "very-high",
      "notes": "终极 boss。位于神庙最远端(自入口看顶端)。击杀后瓦解大量房间(0.5 -25%)。",
      "unpackedId": "Atziri",
      "unpackedRoomIndex": 28,
      "unpackedName": "Atziri's Chamber",
      "unpackedFlags": {
        "isPathway": false,
        "isPresentDay": false,
        "isBossReward": false,
        "upgradedByPower": 0
      },
      "unpackedLevels": [
        {
          "level": 1,
          "id": "",
          "name": "Atziri's Chamber",
          "mod": null,
          "modValues": [],
          "description": "Complete the Royal Access Chamber to unlock",
          "description2": ""
        }
      ],
      "dataSource": {
        "unpacked": "Content.ggpk:data/balance/incursion2*.datc64",
        "unpackedAt": "2026-06-01"
      },
      "clientDescription": [
        "Complete the Royal Access Chamber to unlock"
      ],
      "mechanicSource": {
        "acceptedSources": [
          "ggpk_dat_exports",
          "schema_min_json",
          "official_patch_notes",
          "live_observations"
        ],
        "excludedSources": [
          "third_party_frontend_source"
        ],
        "ggpkUpgradeStatus": "no_ggpk_upgrade_sources",
        "upgradeSources": {
          "ggpk": [],
          "local": [],
          "missingFromLocal": [],
          "extraInLocal": []
        },
        "upgradeSemantics": "no_tracked_ggpk_upgrade_rule",
        "powerTier": "none"
      }
    }
  ],
  "rules": {
    "destabilise": {
      "0.4": {
        "selection": "from-chain-end-backward",
        "events": {
          "enterTemple": {
            "destroys": 2,
            "random": true
          },
          "architectKill": {
            "destroysFraction": "approx_1/3",
            "note": "0.4.0c 已减半"
          },
          "atziriKill": {
            "destroysFraction": "approx_1/2",
            "note": "0.4.0c 减 25%"
          },
          "closeTemple": {
            "destroys": "batch",
            "manualSince": "0.4.0e"
          }
        }
      },
      "0.5": {
        "selection": "from-chain-end-backward",
        "downgradeIfNotRemovable": "path",
        "downgradeAppliesTo": [
          "closeTemple",
          "vaultOpen",
          "t3DeviceUse",
          "generalDestabilisation"
        ],
        "events": {
          "architectKill": {
            "destroysFraction": "approx_1/6",
            "note": "0.5 在 0.4.0c 基础上再减半"
          },
          "atziriKill": {
            "destroysFraction": "approx_3/8",
            "note": "0.5 在 0.4.0c 基础上再减 25%"
          }
        }
      }
    },
    "lockMedallion": {
      "id": "juatalotli_medallion",
      "name_zh": "Juatalotli 纹章",
      "droppedBy": [
        "spymaster",
        "smithy",
        "flesh_surgeon",
        "alchemy_lab",
        "thaumaturge",
        "sacrificial_chamber",
        "legion_barrack"
      ],
      "droppedByDetail": {
        "spymaster": [
          1,
          2,
          3,
          4
        ],
        "smithy": [
          3,
          4
        ],
        "flesh_surgeon": [
          3,
          4
        ],
        "alchemy_lab": [
          3,
          4
        ],
        "thaumaturge": [
          3,
          4
        ],
        "sacrificial_chamber": [
          3,
          4
        ],
        "legion_barrack": [
          3,
          4
        ]
      },
      "effect": "贴在房间上,该房不会被瓦解",
      "constraints": {
        "0.4.0c-hotfix-13": "只能贴 T3 房间",
        "0.4.0c-hotfix-15": "限制部分回滚"
      },
      "notes": "**锁牌防护功能 0.5 已废(PN)** — 此 droppedBy/droppedByDetail 仅为掉落源数据准确性,不再代表可用的防瓦解机制。**掉源由 GGPK Incursion2RoomPerLevel.Description2 含 [IncursionMedallionPreventDestabilise|Juatalotli's Medallion] 的行坐实(2026-06-02 本地核实)**:ViperSpymaster L1-4(全 tier)、Smithy/FleshSurgeon/AlchemyLab/Thaumaturge/SacrificialChamber/ViperLegionBarracks 的 T3/T4。先前只列 spymaster(社区共识)已被 GGPK 推翻。collect/medallions.py 逻辑因锁废单独评估,本字段不驱动 collect。"
    },
    "power": {
      "model": "manhattan-diamond",
      "rangeByTier": {
        "1": 3,
        "2": 4,
        "3": 5
      },
      "effect": "binary",
      "note": "曼哈顿距离辐射,不受 path 连通性影响(社区共识,无 GGG 公式)。"
    },
    "grid": {
      "shape": "9x9-diamond-rotated-45",
      "slots": 81,
      "stableActiveRooms": 60,
      "entrancePosition": "south-center",
      "atziriPosition": "farthest-from-entrance"
    },
    "snake": {
      "topology": "single-chain",
      "core": [
        "garrison",
        "spymaster",
        "armoury"
      ],
      "endLockedBy": "juatalotli_medallion",
      "broken_in": "0.5"
    }
  },
  "atlasFullClear": {
    "source": "_extracted/poe2_ggpk_audit/json/AtlasIncursionNodes.json 全点假设(神庙 Atlas Incursion 子树 36 点稳态全点)",
    "validatedAt": "2026-06-03",
    "assumption": "玩家把 Atlas 上 Incursion 子树全部点满(忽略 Atziri's Assets 8032-37 + Vaal Beacon 8038-45 分支,因不打 Atziri / 不建地图遭遇)。",
    "applied": {
      "comment": "A+B 级:这些节点效果已接进模型(t4Unlocked 默认 true / Royal Prerogative 免塌 / temple_bonus 缩放)。",
      "transcendentProgress": {
        "node": "Transcendent Progress (8027)",
        "stat": "map_incursion_room_tier_4_unlocked",
        "value": 1,
        "effect": "t4Unlocked 默认 true — 全点必点,房间正常可升到 T4。",
        "wiredIn": "01-core.js state.t4Unlocked / 07-mechanics.js resetTemple / Python state.t4_unlocked"
      },
      "royalPrerogative": {
        "node": "Royal Prerogative (8030)",
        "stat": "map_incursion_reward_room_avoid_deletion_chance_%",
        "value": 15,
        "effect": "category=reward 房被塌陷选中时,15% 几率免疫(独立 roll,与塌陷选点算法解耦,用同一 rng 序列保 JS↔Python parity)。",
        "wiredIn": "01-core.js applyDestabilize/applyDestabiliseBatch / destabilise.py"
      },
      "templeBonusScaling": {
        "comment": "⚠ 语义推断:room_temple_bonuses_+% 系列推断=房间 modBonus 贡献缩放,语义待游戏实测确认。三节点同为 'increased effect of temple bonuses',按 PoE 同类 increased 相加 + IDA loot (1+totalBonus%/100) 结构 → 三者 +% 求和后一次性 (1+Σ%),非各自相乘;该 bucket 再乘到每房 modBonus 贡献(在 ampMult×modsMult×statWeight×decay 之外)。例:每型第1房 ×2.7、第1房且满4邻 ×2.9、纯 Power Relays ×1.2。各节点 mult=1+value/100,代码用 (mult-1) 取 +% 求和。",
        "powerRelays": {
          "node": "Power Relays (8026)",
          "stat": "map_incursion_room_temple_bonuses_+%",
          "value": 20,
          "mult": 1.2,
          "effect": "所有 reachable 产出房 ×1.2(无条件)。"
        },
        "efficientArteries": {
          "node": "Efficient Arteries (8043)",
          "stat": "map_incursion_room_temple_bonuses_+%_with_4_adjacent_rooms",
          "value": 20,
          "mult": 1.2,
          "adjacentRoomsThreshold": 4,
          "effect": "该房邻接 room 数 ≥4 时 +20%(并入 temple_bonus 求和,非独立相乘)。",
          "adjacentRoomDef": "⚠ 本地推断:邻接 room = 上下左右 4 邻中 content 非 empty / 非 path / 未 destroyed 的格子。path 不计为 room。语义待实测确认。"
        },
        "xipocadoMachinations": {
          "node": "Xipocado's Machinations (8025)",
          "stat": "map_incursion_room_temple_bonuses_+%_for_1_room_per_type",
          "value": 150,
          "mult": 2.5,
          "effect": "每种 content 房型的第 1 个房 +150%(并入 temple_bonus 求和,非独立相乘)。",
          "firstRoomDef": "⚠ 本地推断:'第 1 个'用现有 loot 衰减的同一排序键(组内 tier 降序、tier 相同按 tileKey 升序),取 k=0 那个房。语义待实测确认。"
        }
      }
    },
    "coefficientsOnly": {
      "comment": "C 级:系数真值已记,但叠占位基线(塌陷数量 / 掉率 / 奖励 / 等级基线本身待实测),暂不接逻辑。",
      "reducedDestabilisation": {
        "node": "19× Reduced Destabilization (8004-8022)",
        "stat": "map_incursion_destabilisation_+%",
        "perNode": -2,
        "totalPct": -38,
        "effect": "全 19 个小点合计 −38% 塌陷。系数真,但塌陷数量基线本身是占位(EVENT_PERCENT 待实测),故暂不接逻辑。"
      },
      "stolenAuthority": {
        "node": "Stolen Authority (8024)",
        "stat": "map_incursion_increased_medallions_+%",
        "value": 35,
        "effect": "+35% 纹章。系数真,掉率基线(MEDALLION_DROP_RATE_BY_TIER)占位、非建模目标(用户定:掉率说不准),暂不接逻辑。"
      },
      "protectedTreasures": {
        "node": "Protected Treasures (8029)",
        "stat": "map_incursion_base_reward_rooms_reward_increase_%",
        "value": 50,
        "effect": "+50% base reward room 奖励。系数真,reward 基线(VAULT_VALUE_CLASS)占位,暂不接逻辑。"
      },
      "trainingAndPreparation": {
        "node": "Training and Preparation (8023)",
        "stat": "map_incursion_temple_level_+",
        "value": 1,
        "effect": "+1 神庙等级。系数真,等级基线本身占位,暂不接逻辑。"
      },
      "secretsOfTheAncients": {
        "node": "Secrets of the Ancients (8028)",
        "stat": "map_incursion_biome_reward_rooms_unlocked",
        "value": 1,
        "effect": "biome 房解锁 — 已作数据条目纳入(rooms.json category=biome)。"
      }
    },
    "ignored": {
      "comment": "忽略的分支:不打 Atziri / 不建地图遭遇。",
      "atziriAssets": "Atziri's Assets 系列 (8032-8037) — 不打 Atziri,忽略。",
      "vaalBeacon": "Vaal Beacon 系列 (8038-8042, 8044) — 不建地图遭遇,忽略。注:8043=Efficient Arteries 已接入 applied.templeBonusScaling(不在此列);8045=The Lost Architect、8031=Expanded Designs 本模型未单列(地图 mod 纹章 / 建筑师多 1 奖励房,影响小)。"
    }
  }
};
