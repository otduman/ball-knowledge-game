import { parseRoster } from '../parse';

/**
 * Format: Name | Country | pop | aliases (semicolon separated)
 *
 * Fighters are placed by the flag they compete under. That puts Adesanya in
 * Africa (Nigeria) rather than Oceania, and Chimaev in the Nordic region
 * (Sweden) rather than Eastern Europe.
 */
export const UFC = parseRoster(
  'ufc',
  `
# ---- Africa ----
Francis Ngannou|Cameroon|40
Israel Adesanya|Nigeria|35|Izzy; The Last Stylebender
Kamaru Usman|Nigeria|30
Dricus du Plessis|South Africa|20
Sodiq Yusuff|Nigeria|5
Themba Gorimbo|Zimbabwe|4
Abdul Razak Alhassan|Ghana|3
Cameron Saaiman|South Africa|3
Mohammed Usman|Nigeria|2
Mounir Lazzez|Tunisia|2
Anthony Njokuani|Nigeria|2
Don Madge|South Africa|1
Garreth McLellan|South Africa|1
JP Buys|South Africa|1

# ---- South America ----
Anderson Silva|Brazil|30|The Spider
Charles Oliveira|Brazil|25|Do Bronx
Alex Pereira|Brazil|25|Poatan
Jose Aldo|Brazil|18|José Aldo
Amanda Nunes|Brazil|12|The Lioness
Wanderlei Silva|Brazil|8
Alexandre Pantoja|Brazil|8
Marlon Vera|Ecuador|6|Chito Vera
Deiveson Figueiredo|Brazil|6
Junior dos Santos|Brazil|6|Cigano
Mauricio Rua|Brazil|6|Shogun Rua; Maurício Rua
Glover Teixeira|Brazil|5
Vitor Belfort|Brazil|5
Lyoto Machida|Brazil|5
Cris Cyborg|Brazil|5|Cristiane Justino
Rafael dos Anjos|Brazil|5
Paulo Costa|Brazil|5
Fabricio Werdum|Brazil|5|Fabrício Werdum
Antonio Rodrigo Nogueira|Brazil|5|Minotauro
Santiago Ponzinibbio|Argentina|4
Gilbert Burns|Brazil|4
Demian Maia|Brazil|4
Diego Lopes|Brazil|4
Michel Pereira|Brazil|3
Johnny Walker|Brazil|3
Jessica Andrade|Brazil|3|Jéssica Andrade
Renan Barao|Brazil|3|Renan Barão
Thiago Santos|Brazil|3
Edson Barboza|Brazil|3
Ronaldo Souza|Brazil|3|Jacare Souza
Caio Borralho|Brazil|3
Jailton Almeida|Brazil|3
Vicente Luque|Brazil|3
Guido Cannetti|Argentina|2
Marlon Moraes|Brazil|2
Claudia Gadelha|Brazil|2|Cláudia Gadelha
Pedro Munhoz|Brazil|2
Rodolfo Vieira|Brazil|2
Esteban Ribovics|Argentina|2
Ignacio Bahamondes|Chile|2
Francisco Prado|Argentina|1

# ---- North America ----
Jon Jones|United States|40|Bones Jones
Georges St-Pierre|Canada|30|GSP
Ronda Rousey|United States|25
Daniel Cormier|United States|20|DC
Sean O'Malley|United States|20|Suga Sean
Dustin Poirier|United States|20
Justin Gaethje|United States|18
Max Holloway|United States|18
Chuck Liddell|United States|15|The Iceman
Brock Lesnar|United States|15
Stipe Miocic|United States|15
Jorge Masvidal|United States|15|Gamebred
Nate Diaz|United States|15
Randy Couture|United States|12
Cain Velasquez|United States|10
Colby Covington|United States|12
Michael Chandler|United States|10
Sean Strickland|United States|10
Henry Cejudo|United States|8
Demetrious Johnson|United States|8|Mighty Mouse
Derrick Lewis|United States|8
Donald Cerrone|United States|8|Cowboy Cerrone
Nick Diaz|United States|8
Tito Ortiz|United States|8
BJ Penn|United States|8
Holly Holm|United States|8
Belal Muhammad|United States|8
Rose Namajunas|United States|8
Aljamain Sterling|United States|8
Brandon Moreno|Mexico|8
Matt Hughes|United States|6
Tyron Woodley|United States|6
Bo Nickal|United States|6
Kayla Harrison|United States|6
Yair Rodriguez|Mexico|6|Yair Rodríguez
Rashad Evans|United States|5
Frankie Edgar|United States|5
Miesha Tate|United States|5
Kevin Holland|United States|5
Chris Weidman|United States|5
Robbie Lawler|United States|5
Anthony Pettis|United States|5
Urijah Faber|United States|5
TJ Dillashaw|United States|5
Cory Sandhagen|United States|5
Alexa Grasso|Mexico|5
Forrest Griffin|United States|4
Luke Rockhold|United States|4
Eddie Alvarez|United States|4
Cody Garbrandt|United States|4
Curtis Blaydes|United States|4
Kelvin Gastelum|United States|4
Bryce Mitchell|United States|4
Julianna Pena|United States|4|Julianna Peña
Rory MacDonald|Canada|4
Jared Cannonier|United States|3
Brandon Royval|United States|3
Joseph Benavidez|United States|3
Carla Esparza|United States|3
Raquel Pennington|United States|3
Irene Aldana|Mexico|3
Raul Rosas Jr.|Mexico|3
Mike Malott|Canada|2
Charles Jourdain|Canada|2
Erik Perez|Mexico|1
Yazmin Jauregui|Mexico|2
Arjan Bhullar|Canada|1
Elias Theodorou|Canada|1
Sarah Kaufman|Canada|1
Alexis Davis|Canada|1

# ---- UK & Ireland ----
Conor McGregor|Ireland|55|The Notorious
Michael Bisping|England|25
Leon Edwards|England|20|Rocky
Tom Aspinall|England|20
Paddy Pimblett|England|15|The Baddy
Darren Till|England|8
Ian Machado Garry|Ireland|8|Ian Garry
Arnold Allen|England|5
Lerone Murphy|England|4
Molly McCann|England|4
Dan Hardy|England|3
Jimi Manuwa|England|3
Joseph Duffy|Ireland|3
Paul Craig|Scotland|3
Muhammad Mokaev|England|3
Cathal Pendred|Ireland|2
Paddy Holohan|Ireland|2
Nathaniel Wood|England|2
Joanne Wood|Scotland|2|Joanne Calderwood
Ross Pearson|England|2
Brad Pickett|England|2
Jack Marshman|Wales|1
Danny Roberts|England|1
Jai Herbert|England|1
Norman Parke|Northern Ireland|1
Rhys McKee|Northern Ireland|1
Chris Duncan|Scotland|1
Danny Henry|Scotland|1

# ---- Western Europe ----
Ciryl Gane|France|15|Bon Gamin
Alistair Overeem|Netherlands|12
Volkan Oezdemir|Switzerland|6|Volkan Özdemir
Bas Rutten|Netherlands|6
Aleksandar Rakic|Austria|8|Aleksandar Rakić
Benoit Saint Denis|France|6|Benoît Saint Denis
Manon Fiorot|France|5
Nassourdine Imavov|France|5
Cheick Kongo|France|4
Germaine de Randamie|Netherlands|4
Stefan Struve|Netherlands|3
Abus Magomedov|Germany|2
Morgan Charriere|France|2|Morgan Charrière
Fares Ziam|France|2|Farès Ziam
Peter Sobotta|Germany|1
Nick Hein|Germany|1
Khalid Taha|Germany|1
William Gomis|France|1
Francis Carmont|France|1
Ismail Naurdiev|Austria|1

# ---- Southern Europe ----
Marvin Vettori|Italy|8
Manel Kape|Portugal|4
Joel Alvarez|Spain|3|Joel Álvarez
Alessio Di Chirico|Italy|1
Carlo Pedersoli Jr.|Italy|1
Daniel Barez|Spain|1|Daniel Bárez
Constantinos Philippou|Cyprus|1|Costas Philippou

# ---- Eastern Europe ----
Khabib Nurmagomedov|Russia|45|The Eagle
Islam Makhachev|Russia|25
Ilia Topuria|Georgia|20|El Matador
Merab Dvalishvili|Georgia|15|The Machine
Mirko Cro Cop|Croatia|15|Mirko Filipovic
Jan Blachowicz|Poland|15|Jan Błachowicz
Petr Yan|Russia|12|No Mercy
Joanna Jedrzejczyk|Poland|12|Joanna Jędrzejczyk
Alexander Volkov|Russia|10
Magomed Ankalaev|Russia|10
Arman Tsarukyan|Armenia|8
Umar Nurmagomedov|Russia|6
Mateusz Gamrot|Poland|6
Movsar Evloev|Russia|5
Sergei Pavlovich|Russia|5
Zabit Magomedsharipov|Russia|5
Rafael Fiziev|Azerbaijan|5|Ataman
Nikita Krylov|Ukraine|4
Roman Dolidze|Georgia|4
Ante Delija|Croatia|4
Shara Magomedov|Russia|4|Shara Bullet
Dusko Todorovic|Serbia|3|Duško Todorović
Uros Medic|Serbia|3|Uroš Medić
Marcin Tybura|Poland|3
Karolina Kowalkiewicz|Poland|3
Yana Santos|Russia|3|Yana Kunitskaya
Rustam Khabilov|Russia|2
Michal Oleksiejczuk|Poland|2|Michał Oleksiejczuk
Aleksei Oleinik|Russia|2
Roman Kopylov|Russia|2
Krzysztof Jotko|Poland|1
Damir Ismagulov|Russia|1
Mairbek Taisumov|Russia|1

# ---- Nordic ----
Khamzat Chimaev|Sweden|25|Borz
Alexander Gustafsson|Sweden|25|The Mauler
Gunnar Nelson|Iceland|8
Ilir Latifi|Sweden|8
Jack Hermansson|Norway|8|The Joker
Makwan Amirkhani|Finland|6
Mark O. Madsen|Denmark|5
Nicolas Dalby|Denmark|4
Joachim Christensen|Denmark|3
Emil Meek|Norway|3
Teemu Packalen|Finland|2|Teemu Packalén
Damir Hadzovic|Denmark|2|Damir Hadžović
Reza Madadi|Sweden|2
Magnus Cedenblad|Sweden|1
Nico Musoke|Sweden|1
Papy Abedi|Sweden|1
Anton Turkalj|Sweden|1

# ---- Asia & Oceania ----
Alexander Volkanovski|Australia|25|The Great
Robert Whittaker|Australia|20|The Reaper
Jack Della Maddalena|Australia|12
Zhang Weili|China|12
Valentina Shevchenko|Kyrgyzstan|12|Bullet
Tai Tuivasa|Australia|10|Bam Bam
Mark Hunt|New Zealand|10|The Super Samoan
Dan Hooker|New Zealand|8|The Hangman
Chan Sung Jung|South Korea|8|The Korean Zombie
Kai Kara-France|New Zealand|5
Carlos Ulberg|New Zealand|5
Li Jingliang|China|4
Song Yadong|China|4
Yan Xiaonan|China|4
Kazushi Sakuraba|Japan|4
Steve Erceg|Australia|4
Kyoji Horiguchi|Japan|3
Yushin Okami|Japan|3
Takanori Gomi|Japan|3
Dooho Choi|South Korea|3
Tyson Pedro|Australia|2
Jimmy Crute|Australia|2
Casey O'Neill|Australia|2
Brad Riddell|New Zealand|2
Jun Yong Park|South Korea|2
Bogdan Guskov|Uzbekistan|2
Makhmud Muradov|Uzbekistan|2
Jamie Mullarkey|Australia|1
Shane Young|New Zealand|1
Navajo Stirling|New Zealand|1
Da Un Jung|South Korea|1
Hyun Sung Park|South Korea|1
Anshul Jubli|India|1
Bharat Kandare|India|1
`,
);
