import { parseRoster } from '../parse';

/**
 * Format: Name | Country | pop | aliases (semicolon separated)
 *
 * Country is the nationality the player is publicly identified with, which for
 * this roster means the national team they represent or the country they were
 * born in and are billed as. Embiid (Cameroon) and Olajuwon (Nigeria) sit in
 * Africa on that basis even though both later took US citizenship.
 */
export const NBA = parseRoster(
  'nba',
  `
# ---- Africa ----
Joel Embiid|Cameroon|40
Hakeem Olajuwon|Nigeria|35|Akeem Olajuwon
Dikembe Mutombo|DR Congo|20
Pascal Siakam|Cameroon|20
Serge Ibaka|Congo|15
Luol Deng|South Sudan|10
Manute Bol|South Sudan|8
Bismack Biyombo|DR Congo|6
Bol Bol|South Sudan|6
Luc Mbah a Moute|Cameroon|5
Precious Achiuwa|Nigeria|5
Gorgui Dieng|Senegal|4
Josh Okogie|Nigeria|4
Michael Olowokandi|Nigeria|4
Tacko Fall|Senegal|4
Khaman Maluach|South Sudan|4
Thon Maker|South Sudan|3
Yves Missi|Cameroon|3
Cheick Diallo|Mali|2
Salah Mejri|Tunisia|2
Christian Koloko|Cameroon|2
Festus Ezeli|Nigeria|2
Didier Ilunga-Mbenga|DR Congo|2|DJ Mbenga
Charles Bassey|Nigeria|2
Amida Brimah|Ghana|1
Mamadou Ndiaye|Senegal|1

# ---- South America ----
Manu Ginobili|Argentina|45|Manu Ginóbili
Luis Scola|Argentina|15
Nene|Brazil|12|Nenê
Anderson Varejao|Brazil|12|Anderson Varejão
Facundo Campazzo|Argentina|8
Leandro Barbosa|Brazil|8
Tiago Splitter|Brazil|6
Andres Nocioni|Argentina|6|Andrés Nocioni
Fabricio Oberto|Argentina|4
Carlos Delfino|Argentina|4
Greivis Vasquez|Venezuela|4|Greivis Vásquez
Gabriel Deck|Argentina|3
Raul Neto|Brazil|3|Raulzinho
Bruno Caboclo|Brazil|2
Marcelo Huertas|Brazil|2
Cristiano Felicio|Brazil|1|Cristiano Felício
Jaime Echenique|Colombia|1
Oscar Torres|Venezuela|1|Óscar Torres
Nicolas Laprovittola|Argentina|1|Nicolás Laprovíttola
Patricio Garino|Argentina|1
Walter Herrmann|Argentina|1
Didi Louzada|Brazil|1

# ---- North America ----
LeBron James|United States|55|King James
Michael Jordan|United States|50|MJ
Stephen Curry|United States|45|Steph Curry
Kobe Bryant|United States|40
Kevin Durant|United States|35|KD
Shaquille O'Neal|United States|30|Shaq
Magic Johnson|United States|20
Larry Bird|United States|20
Jayson Tatum|United States|20
Tim Duncan|United States|18
Kareem Abdul-Jabbar|United States|18
Anthony Edwards|United States|18
James Harden|United States|18
Shai Gilgeous-Alexander|Canada|18|SGA
Allen Iverson|United States|15
Dwyane Wade|United States|15
Russell Westbrook|United States|15
Ja Morant|United States|15
Kawhi Leonard|United States|14
Anthony Davis|United States|14
Carmelo Anthony|United States|14
Kyrie Irving|United States|14
Devin Booker|United States|12
Damian Lillard|United States|12
Jimmy Butler|United States|12
Zion Williamson|United States|12
Chris Paul|United States|12
Vince Carter|United States|12
Wilt Chamberlain|United States|12
Steve Nash|Canada|12
Paul George|United States|10
Dwight Howard|United States|10
Charles Barkley|United States|10
Scottie Pippen|United States|10
Bill Russell|United States|10
Kevin Garnett|United States|10
Klay Thompson|United States|10
Draymond Green|United States|10
Derrick Rose|United States|10
Donovan Mitchell|United States|10
Jamal Murray|Canada|10
Jerry West|United States|8
Karl Malone|United States|8
John Stockton|United States|8
Tracy McGrady|United States|8|T-Mac
Dennis Rodman|United States|8
Trae Young|United States|8
Tyrese Haliburton|United States|8
LaMelo Ball|United States|8
Jalen Brunson|United States|8
Jaylen Brown|United States|8
Karl-Anthony Towns|United States|8|KAT
Andrew Wiggins|Canada|8
David Robinson|United States|7
Patrick Ewing|United States|7
Paul Pierce|United States|7
De'Aaron Fox|United States|7
Paolo Banchero|United States|7
Oscar Robertson|United States|6
Reggie Miller|United States|6
Ray Allen|United States|6
Julius Erving|United States|6|Dr J
Blake Griffin|United States|6
Bam Adebayo|United States|6
Bradley Beal|United States|6
Chet Holmgren|United States|6
Cade Cunningham|United States|6
Chris Bosh|United States|5
Isiah Thomas|United States|5
Zach LaVine|United States|5
Al Horford|Dominican Republic|5
Zach Edey|Canada|5
Andre Drummond|United States|4
Dillon Brooks|Canada|4
Lu Dort|Canada|4
Bennedict Mathurin|Canada|4
RJ Barrett|Canada|5
Scoot Henderson|United States|3
Kelly Olynyk|Canada|3
Tristan Thompson|Canada|3
Nickeil Alexander-Walker|Canada|3
Cory Joseph|Canada|2
Trey Lyles|Canada|2
Juan Toscano-Anderson|Mexico|2
Eduardo Najera|Mexico|2|Eduardo Nájera
Chris Duarte|Dominican Republic|1
Francisco Garcia|Dominican Republic|1|Francisco García
Khem Birch|Canada|1
Leonard Miller|Canada|1
Gustavo Ayon|Mexico|1|Gustavo Ayón
Horacio Llamas|Mexico|1
Jorge Gutierrez|Mexico|1|Jorge Gutiérrez

# ---- UK & Ireland ----
OG Anunoby|England|5
Ben Gordon|England|3
Joel Freeland|England|1
Pops Mensah-Bonsu|England|1

# ---- Western Europe ----
Dirk Nowitzki|Germany|30
Victor Wembanyama|France|30|Wemby
Tony Parker|France|20
Rudy Gobert|France|15
Joakim Noah|France|10
Dennis Schroder|Germany|8|Dennis Schröder
Franz Wagner|Germany|8
Nicolas Batum|France|8
Boris Diaw|France|6
Evan Fournier|France|6
Clint Capela|Switzerland|6
Isaiah Hartenstein|Germany|5
Alex Sarr|France|5
Zaccharie Risacher|France|5
Moritz Wagner|Germany|4
Detlef Schrempf|Germany|4
Jakob Poeltl|Austria|4|Jakob Pöltl
Thabo Sefolosha|Switzerland|4
Rik Smits|Netherlands|4
Bilal Coulibaly|France|4
Daniel Theis|Germany|3
Maxi Kleber|Germany|3
Frank Ntilikina|France|3
Guerschon Yabusele|France|3
Toumani Camara|Belgium|3
Killian Hayes|France|2
Ousmane Dieng|France|2
Theo Maledon|France|2|Théo Maledon
Ian Mahinmi|France|2
Ronny Turiaf|France|2
Mickael Pietrus|France|2|Mickaël Piétrus
Paul Zipser|Germany|1
Tibor Pleiss|Germany|1|Tibor Pleiß
Timothe Luwawu-Cabarrot|France|1|Timothé Luwawu-Cabarrot
Tariq Abdul-Wahad|France|1
Rodrigue Beaubois|France|1
Vincent Poirier|France|1

# ---- Southern Europe ----
Giannis Antetokounmpo|Greece|40|Greek Freak
Pau Gasol|Spain|20
Marc Gasol|Spain|12
Ricky Rubio|Spain|10
Danilo Gallinari|Italy|6
Thanasis Antetokounmpo|Greece|5
Santi Aldama|Spain|4
Marco Belinelli|Italy|4
Andrea Bargnani|Italy|4
Jose Calderon|Spain|4|José Calderón
Willy Hernangomez|Spain|3|Willy Hernangómez
Juancho Hernangomez|Spain|3|Juancho Hernangómez
Rudy Fernandez|Spain|3|Rudy Fernández
Kostas Antetokounmpo|Greece|3
Simone Fontecchio|Italy|3
Nico Mannion|Italy|2
Usman Garuba|Spain|2
Sergio Rodriguez|Spain|2|Sergio Rodríguez
Alex Abrines|Spain|2|Álex Abrines
Vassilis Spanoulis|Greece|2
Neemias Queta|Portugal|2
Gigi Datome|Italy|1
Kostas Papanikolaou|Greece|1
Georgios Papagiannis|Greece|1
Fernando Martin|Spain|1|Fernando Martín

# ---- Eastern Europe ----
Nikola Jokic|Serbia|50|Nikola Jokić; Joker
Luka Doncic|Slovenia|45|Luka Dončić
Nikola Vucevic|Montenegro|15|Nikola Vučević
Kristaps Porzingis|Latvia|15|Kristaps Porziņģis
Domantas Sabonis|Lithuania|15
Vlade Divac|Serbia|15
Bogdan Bogdanovic|Serbia|12|Bogdan Bogdanović
Peja Stojakovic|Serbia|12|Peja Stojaković
Toni Kukoc|Croatia|12|Toni Kukoč
Andrei Kirilenko|Russia|12
Jusuf Nurkic|Bosnia and Herzegovina|10|Jusuf Nurkić
Bojan Bogdanovic|Croatia|10|Bojan Bogdanović
Goran Dragic|Slovenia|10|Goran Dragić
Jonas Valanciunas|Lithuania|10|Jonas Valančiūnas
Drazen Petrovic|Croatia|10|Dražen Petrović
Alperen Sengun|Turkiye|10|Alperen Şengün
Boban Marjanovic|Serbia|8|Boban Marjanović
Arvydas Sabonis|Lithuania|8
Zydrunas Ilgauskas|Lithuania|8|Žydrūnas Ilgauskas
Timofey Mozgov|Russia|8
Hedo Turkoglu|Turkiye|8|Hedo Türkoğlu
Dario Saric|Croatia|6|Dario Šarić
Ivica Zubac|Croatia|6
Darko Milicic|Serbia|6|Darko Miličić
Marcin Gortat|Poland|6
Jeremy Sochan|Poland|6
Mehmet Okur|Turkiye|6
Enes Freedom|Turkiye|6|Enes Kanter
Alex Len|Ukraine|5
Alexey Shved|Russia|5
Zaza Pachulia|Georgia|5
Nikola Jovic|Serbia|4|Nikola Jović
Nikola Pekovic|Montenegro|4|Nikola Peković
Tomas Satoransky|Czech Republic|4|Tomáš Satoranský
Sarunas Marciulionis|Lithuania|4|Šarūnas Marčiulionis
Egor Demin|Russia|4
Ersan Ilyasova|Turkiye|4|Ersan İlyasova
Cedi Osman|Turkiye|4
Andris Biedrins|Latvia|4|Andris Biedriņš
Davis Bertans|Latvia|4|Dāvis Bertāns
Vasilije Micic|Serbia|3|Vasilije Micić
Jan Vesely|Czech Republic|3|Jan Veselý
Vladimir Radmanovic|Serbia|3|Vladimir Radmanović
Sviatoslav Mykhailiuk|Ukraine|3
Furkan Korkmaz|Turkiye|3
Omer Asik|Turkiye|3|Ömer Aşık
Goga Bitadze|Georgia|3
Milos Teodosic|Serbia|3|Miloš Teodosić
Sasha Vujacic|Slovenia|3|Sasha Vujačić
Mario Hezonja|Croatia|3
Nikola Topic|Serbia|3|Nikola Topić
Vlatko Cancar|Slovenia|2|Vlatko Čančar
Ante Zizic|Croatia|2|Ante Žižić
Donatas Motiejunas|Lithuania|2|Donatas Motiejūnas
Linas Kleiza|Lithuania|2
Nenad Krstic|Serbia|2|Nenad Krstić
Beno Udrih|Slovenia|2
Dragan Bender|Croatia|2
Sandro Mamukelashvili|Georgia|2
Semih Erden|Turkiye|1
Rodions Kurucs|Latvia|1
Anzejs Pasecniks|Latvia|1|Anžejs Pasečņiks
Marko Jaric|Serbia|1|Marko Jarić
Primoz Brezec|Slovenia|1|Primož Brezec
Zoran Dragic|Slovenia|1|Zoran Dragić
Damjan Rudez|Croatia|1|Damjan Rudež
Roko Ukic|Croatia|1|Roko Ukić
Tristan Vukcevic|Serbia|1|Tristan Vukčević
Vit Krejci|Czech Republic|1|Vít Krejčí
Sergey Karasev|Russia|1
Viacheslav Kravtsov|Ukraine|1
Kyrylo Fesenko|Ukraine|1
Cezary Trybanski|Poland|1|Cezary Trybański
Maciej Lampe|Poland|1
Tornike Shengelia|Georgia|1

# ---- Nordic ----
Lauri Markkanen|Finland|15
Hanno Mottola|Finland|2|Hanno Möttölä
Jeffery Taylor|Sweden|2
Petur Gudmundsson|Iceland|1|Pétur Guðmundsson

# ---- Asia & Oceania ----
Yao Ming|China|25
Ben Simmons|Australia|15
Rui Hachimura|Japan|10
Steven Adams|New Zealand|10
Patty Mills|Australia|8
Andrew Bogut|Australia|8
Josh Giddey|Australia|8
Deni Avdija|Israel|8
Yuta Watanabe|Japan|6
Joe Ingles|Australia|6
Dyson Daniels|Australia|6
Yi Jianlian|China|6
Omri Casspi|Israel|5
Matisse Thybulle|Australia|4
Matthew Dellavedova|Australia|4
Dante Exum|Australia|4
Hamed Haddadi|Iran|4
Aron Baynes|Australia|3
Zhou Qi|China|3
Wang Zhizhi|China|3
Yuki Kawamura|Japan|3
Jock Landale|Australia|2
Duop Reath|Australia|2
Sun Yue|China|2
Mengke Bateer|China|1
Sean Marks|New Zealand|1
Satnam Singh|India|1
`,
);
